import SwiftUI
import HealthKit

struct ContentView: View {
    @StateObject private var sync = HealthSyncManager()
    @AppStorage("healthSyncBaseURL") private var baseURL = ""
    @State private var token = ""
    var body: some View {
        NavigationStack {
            Form {
                Section("工作台连接") {
                    TextField("Worker 地址（https://…workers.dev）", text: $baseURL).textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                    SecureField("健康同步密钥", text: $token)
                    Text("密钥只保存在此 iPhone 的钥匙串。HealthKit 数据会通过 HTTPS 同步到你的 D1 数据库。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Section("同步状态") {
                    Label(sync.status, systemImage: sync.isBusy ? "arrow.triangle.2.circlepath" : "heart.text.square")
                    if !sync.lastSync.isEmpty { Text("上次同步：\(sync.lastSync)").font(.footnote).foregroundStyle(.secondary) }
                    Button {
                        sync.token = token
                        Task { await sync.connectAndSync() }
                    } label: {
                        HStack { Spacer(); if sync.isBusy { ProgressView() } else { Text("授权并同步健康数据") }; Spacer() }
                    }.disabled(sync.isBusy)
                }
                Section("自动同步") {
                    Text("首次授权并同步后，HealthKit 后台更新会触发同步。iOS 会按系统策略调度后台唤醒，频率不保证实时。也可随时打开 App 手动刷新。")
                        .font(.footnote)
                }
            }
            .navigationTitle("shary 健康同步")
            .onAppear { token = sync.token; sync.restoreStatus() }
        }
    }
}
