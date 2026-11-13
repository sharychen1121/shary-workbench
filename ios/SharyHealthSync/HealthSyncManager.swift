import Foundation
import HealthKit

struct DailyHealth: Codable, Identifiable {
    var date: String
    var activeEnergyKcal: Double = 0
    var exerciseMinutes: Double = 0
    var standHours: Double = 0
    var steps: Double = 0
    var distanceKm: Double = 0
    var flights: Double = 0
    var heartRateMin: Double = 0
    var heartRateMax: Double = 0
    var workouts: [WorkoutSummary] = []
    var id: String { date }
}
struct WorkoutSummary: Codable {
    var name: String
    var start: String
    var minutes: Double
    var activeEnergyKcal: Double
    var distanceKm: Double
}

@MainActor final class HealthSyncManager: ObservableObject {
    @Published var status = "尚未连接"
    @Published var isBusy = false
    @Published var lastSync = ""
    private let store = HKHealthStore()
    private let tokenKey = "healthSyncToken"\n    private var observersInstalled = false\n    private var standHourKeys = Set<String>()
    var baseURL: String {
        get { UserDefaults.standard.string(forKey: "healthSyncBaseURL") ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: "healthSyncBaseURL") }
    }
    var token: String {
        get { Keychain.read(tokenKey) ?? "" }
        set { _ = Keychain.save(tokenKey, value: newValue) }
    }
    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        let quantities: [HKQuantityTypeIdentifier] = [.stepCount,.activeEnergyBurned,.appleExerciseTime,.distanceWalkingRunning,.flightsClimbed,.heartRate]
        quantities.compactMap(HKObjectType.quantityType(forIdentifier:)).forEach { types.insert($0) }
        if let stand = HKObjectType.categoryType(forIdentifier: .appleStandHour) { types.insert(stand) }
        types.insert(HKObjectType.workoutType())
        return types
    }
    func connectAndSync() async {
        guard HKHealthStore.isHealthDataAvailable() else { status = "此设备不支持 HealthKit"; return }
        guard !baseURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !token.isEmpty else {
            status = "请先填写 Worker 地址和同步密钥"; return
        }
        isBusy = true
        defer { isBusy = false }
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            try await uploadRecentDays()
            enableBackgroundUpdates()
            lastSync = Date.now.formatted(date: .numeric, time: .shortened)
            UserDefaults.standard.set(lastSync, forKey: "healthLastSync")
            status = "已同步 · " + lastSync
        } catch { status = "同步失败：" + error.localizedDescription }
    }
    func restoreStatus() { lastSync = UserDefaults.standard.string(forKey: "healthLastSync") ?? "" }\n    func resumeBackgroundDeliveryIfConfigured() { if !baseURL.isEmpty && !token.isEmpty { enableBackgroundUpdates() } }
    private func enableBackgroundUpdates() {
        let types: [HKSampleType] = [
            HKObjectType.quantityType(forIdentifier: .stepCount),
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned),
            HKObjectType.quantityType(forIdentifier: .appleExerciseTime),
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning),
            HKObjectType.categoryType(forIdentifier: .appleStandHour),
            HKObjectType.workoutType()
        ].compactMap { $0 }
        for type in types {
            let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, completion, _ in
                Task { @MainActor in
                    guard let self else { completion(); return }
                    do { try await self.uploadRecentDays() } catch { self.status = "后台同步失败" }
                    completion()
                }
            }
            store.execute(query)
            store.enableBackgroundDelivery(for: type, frequency: .hourly) { _, _ in }
        }
    }
    private func uploadRecentDays() async throws {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        guard let first = calendar.date(byAdding: .day, value: -29, to: today),
              let end = calendar.date(byAdding: .day, value: 1, to: today) else { return }
        let rows = await loadDailyRows(from: first, through: end)
        guard let url = URL(string: baseURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/")) + "/api/health") else {
            throw SyncError.badURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["days": rows])
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode) else {
            throw SyncError.serverRejected
        }
    }
    private func loadDailyRows(from first: Date, through end: Date) async -> [DailyHealth] {
        let calendar = Calendar.current
        var map: [String: DailyHealth] = [:]
        func dayKey(_ date: Date) -> String {
            let c = calendar.dateComponents([.year,.month,.day], from: date)
            return String(format: "%04d-%02d-%02d", c.year ?? 0,c.month ?? 0,c.day ?? 0)
        }
        for identifier: HKQuantityTypeIdentifier in [.stepCount,.activeEnergyBurned,.appleExerciseTime,.distanceWalkingRunning,.flightsClimbed] {
            guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { continue }
            let unit: HKUnit
            switch identifier {
            case .stepCount, .flightsClimbed: unit = .count()
            case .activeEnergyBurned: unit = .kilocalorie()
            case .appleExerciseTime: unit = .minute()
            default: unit = .meter()
            }
            for (date,value) in await dailyTotals(type, from: first, through: end, unit: unit) {
                let key=dayKey(date)
                var row=map[key] ?? DailyHealth(date:key)
                switch identifier {
                case .stepCount: row.steps=value
                case .activeEnergyBurned: row.activeEnergyKcal=value
                case .appleExerciseTime: row.exerciseMinutes=value
                case .distanceWalkingRunning: row.distanceKm=value/1000
                case .flightsClimbed: row.flights=value
                default: break
                }
                map[key]=row
            }
        }
        if let heartType = HKObjectType.quantityType(forIdentifier: .heartRate) {
            for sample in await quantitySamples(heartType, from: first, through: end) {
                let key=dayKey(sample.startDate)
                var row=map[key] ?? DailyHealth(date:key)
                let bpm=sample.quantity.doubleValue(for:HKUnit.count().unitDivided(by:.minute()))
                row.heartRateMin=row.heartRateMin==0 ? bpm : min(row.heartRateMin,bpm)
                row.heartRateMax=max(row.heartRateMax,bpm);map[key]=row
            }
        }
        if let stand = HKObjectType.categoryType(forIdentifier: .appleStandHour) {
            for sample in await categorySamples(stand, from: first, through: end) where sample.value == HKCategoryValueAppleStandHour.stood.rawValue {
                let key = dayKey(sample.startDate)
                var row = map[key] ?? DailyHealth(date: key); row.standHours += 1; map[key] = row
            }
        }
        for workout in await workouts(from: first, through: end) {
            let key = dayKey(workout.startDate)
            var row = map[key] ?? DailyHealth(date: key)
            let minutes = workout.duration / 60
            let energy = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            let distance = workout.totalDistance?.doubleValue(for: .meter()) ?? 0
            row.workouts.append(WorkoutSummary(name: Self.activityName(workout.workoutActivityType), start: ISO8601DateFormatter().string(from: workout.startDate), minutes: minutes, activeEnergyKcal: energy, distanceKm: distance / 1000))
            row.exerciseMinutes = max(row.exerciseMinutes, row.workouts.reduce(0) { $0 + $1.minutes })
            map[key] = row
        }
        return map.values.sorted { $0.date < $1.date }
    }
    private func dailyTotals(_ type: HKQuantityType, from start: Date, through end: Date, unit: HKUnit) async -> [(Date,Double)] {
        let predicate=HKQuery.predicateForSamples(withStart:start,end:end,options:.strictStartDate)
        let query=HKStatisticsCollectionQuery(quantityType:type,quantitySamplePredicate:predicate,options:.cumulativeSum,anchorDate:start,intervalComponents:DateComponents(day:1))
        return await withCheckedContinuation { continuation in
            query.initialResultsHandler={ _,collection,_ in
                var values:[(Date,Double)]=[]
                collection?.enumerateStatistics(from:start,to:end){ statistics,_ in
                    if let quantity=statistics.sumQuantity(){values.append((statistics.startDate,quantity.doubleValue(for:unit)))}
                }
                continuation.resume(returning:values)
            }
            store.execute(query)
        }
    }
    private func quantitySamples(_ type: HKQuantityType, from start: Date, through end: Date) async -> [HKQuantitySample] {
        let p = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return await withCheckedContinuation { continuation in
            store.execute(HKSampleQuery(sampleType: type, predicate: p, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: samples as? [HKQuantitySample] ?? [])
            })
        }
    }
    private func categorySamples(_ type: HKCategoryType, from start: Date, through end: Date) async -> [HKCategorySample] {
        let p = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return await withCheckedContinuation { continuation in
            store.execute(HKSampleQuery(sampleType: type, predicate: p, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: samples as? [HKCategorySample] ?? [])
            })
        }
    }
    private func workouts(from start: Date, through end: Date) async -> [HKWorkout] {
        let p = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return await withCheckedContinuation { continuation in
            store.execute(HKSampleQuery(sampleType: .workoutType(), predicate: p, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: samples as? [HKWorkout] ?? [])
            })
        }
    }
    private static func activityName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .walking: "步行"
        case .running: "跑步"
        case .cycling: "骑行"
        case .swimming: "游泳"
        case .traditionalStrengthTraining, .functionalStrengthTraining: "力量训练"
        case .yoga: "瑜伽"
        case .hiking: "徒步"
        case .dance: "舞蹈"
        default: "训练"
        }
    }
    enum SyncError: LocalizedError {
        case badURL, serverRejected
        var errorDescription: String? { switch self { case .badURL: "Worker 地址无效"; case .serverRejected: "同步服务未接受数据，请检查地址和密钥" } }
    }
}
