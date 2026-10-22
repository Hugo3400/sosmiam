/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "notification-service",
  name: "NotificationService",
  bundleIdentifier: ".NotificationService",
  deploymentTarget: "15.1",
  frameworks: ["UserNotifications", "CryptoKit", "Security"],
  entitlements: {
    "keychain-access-groups": [`$(AppIdentifierPrefix)${config.ios.bundleIdentifier}.partage`],
  },
});
