import Foundation
import Security

enum Keychain {
    static func read(_ key: String) -> String? {
        let q: [String: Any] = [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:"shary.health.sync",kSecAttrAccount as String:key,kSecReturnData as String:true,kSecMatchLimit as String:kSecMatchLimitOne]
        var item: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary,&item)==errSecSuccess,let data=item as? Data else{return nil}
        return String(data:data,encoding:.utf8)
    }
    @discardableResult static func save(_ key: String,value: String)->Bool {
        let q: [String: Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:"shary.health.sync",kSecAttrAccount as String:key]
        let data=Data(value.utf8)
        SecItemDelete(q as CFDictionary)
        var insert=q;insert[kSecValueData as String]=data
        return SecItemAdd(insert as CFDictionary,nil)==errSecSuccess
    }
}
