import CryptoKit
import Foundation
import Security
import UserNotifications

final class NotificationService: UNNotificationServiceExtension {
  private var rendre: ((UNNotificationContent) -> Void)?
  private var contenu: UNMutableNotificationContent?

  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    rendre = contentHandler
    guard let modifiable = request.content.mutableCopy() as? UNMutableNotificationContent else {
      contentHandler(request.content)
      return
    }
    contenu = modifiable
    if let chiffre = request.content.userInfo["apercu"] as? String, let apercu = ApercuMessage.dechiffrer(chiffre) {
      modifiable.title = apercu.titre
      modifiable.body = apercu.texte
    }
    contentHandler(modifiable)
  }

  override func serviceExtensionTimeWillExpire() {
    if let rendre, let contenu {
      rendre(contenu)
    }
  }
}

enum ApercuMessage {
  private static let contexte = Data("sos-miam/apercu/v1".utf8)
  private static let service = "sosmiam.apercu:no-auth"
  private static let compte = "cle-apercu"
  private static let groupe = "4F7UVS2357.fr.sosmiam.app.partage"

  struct Contenu: Decodable {
    let t: String
    let c: String
  }

  static func dechiffrer(_ chiffre: String) -> (titre: String, texte: String)? {
    guard let octets = Data(base64Encoded: chiffre), octets.count > 28, let cle = lireCle(),
          let boite = try? AES.GCM.SealedBox(combined: octets),
          let clair = try? AES.GCM.open(boite, using: cle, authenticating: contexte),
          let lu = try? JSONDecoder().decode(Contenu.self, from: clair),
          !lu.t.isEmpty, !lu.c.isEmpty else {
      return nil
    }
    return (lu.t, lu.c)
  }

  private static func lireCle() -> SymmetricKey? {
    let requete: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: Data(compte.utf8),
      kSecAttrAccessGroup as String: groupe,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnData as String: true,
    ]
    var resultat: CFTypeRef?
    guard SecItemCopyMatching(requete as CFDictionary, &resultat) == errSecSuccess,
          let donnees = resultat as? Data,
          let texte = String(data: donnees, encoding: .utf8),
          let cle = Data(base64Encoded: texte), cle.count == 32 else {
      return nil
    }
    return SymmetricKey(data: cle)
  }
}
