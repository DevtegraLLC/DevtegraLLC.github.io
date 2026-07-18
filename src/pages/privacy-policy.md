---
layout: ../layouts/LegalLayout.astro
title: "Privacy Policy"
description: "How Devtegra collects, uses, and shares information across devtegra.com and the FitCreature mobile app."
---

# Privacy Policy

Effective Date: May 28, 2026
Last Updated: July 11, 2026

This Privacy Policy describes how Devtegra, LLC ("Devtegra," "we," "us," or "our") collects, uses, and shares information when you use our website at devtegra.com and our mobile applications, including FitCreature (collectively, the "Services").

We are committed to being transparent about our data practices. If you have any questions about this Policy, contact us at contact.us@devtegra.com.

## 1. Who We Are

Devtegra is a software development company operating as Devtegra, LLC, based in Texas, United States. You can reach our privacy contact at contact.us@devtegra.com.

## 2. Summary of Our Approach

Before the legal detail, here is what matters most:

- We collect only the data needed to run your account and power the FitCreature game layer.
- Your workouts, health data, body metrics, food entries, and progress photos are processed and stored only on your device. None of them is uploaded to our servers.
- If you opt in to location, your device converts your location into a coarse area code covering an area roughly 5 kilometers across before anything leaves your phone. We never receive or store your precise GPS coordinates.
- FitCreature shows advertising to users without an ad-free subscription, served by Google AdMob. Ads are non-personalized: they are not based on your behavior across other apps or websites. See Section 5.2 for exactly what Google receives.
- We do not sell your personal data.

You can request deletion of your account and associated data at any time from within the app or at devtegra.com/data-deletion.

## 3. Information We Collect

### 3.1 Information You Provide Directly

- Account information. You sign in with your Apple or Google account. We receive and store your email address and a display name taken from that account: the name you choose to share at your first Apple sign-in, your Google profile name, or the first part of your email address. Because it comes from your Apple or Google account, this display name is often your real name. We also store a username. If you ever create an account with an email and password, the password is stored only as a hash; we never store it in plain text.
- Timezone. The app records your device's timezone so that daily features (streaks, daily quests, daily goals) reset on your local day.
- Feedback and reports. If you send in-app feedback, we store the category, title, and message you write, plus your app version. To limit abuse of the feedback channel we store a salted, one-way hash of your IP address; the raw IP address is not stored with your feedback. If you report another user, we store the reason you select, any details you add, and where in the app the report was made.
- Communications. Emails or support messages you send us. We use these to respond to your inquiries.
- Beta program signup. If you sign up to be a FitCreature beta tester at devtegra.com/beta, we store your first and last name, the email address you enter, which mobile platform you selected (iPhone, Android, or both), whether you use a fitness tracker, and which types of exercise you identify with (for example walking, running, cycling, weight training, fitness classes, yoga, or sport practice). We use your name and email to contact you about the beta, your platform to prioritize invites, and your fitness-tracker and exercise answers to invite a well-rounded mix of testers so we can find issues specific to how different people train. This information is used only to run the beta program and never affects the app or gameplay. To limit abuse of the signup form we store a salted, one-way hash of your IP address for rate limiting; the raw IP address is not stored. Your address stays unconfirmed until you tap the link in a confirmation email. You can ask us to remove it at any time at contact.us@devtegra.com, and we delete the beta list once the beta program ends.

Your workout log itself (exercises, sets, reps, weights, durations, and notes), your exercise template library, your body metrics, and any food entries are stored only on your device and are never uploaded to our servers. See Section 3.4.

### 3.2 Health and Fitness Data (Only If You Opt In)

With your permission through Apple Health (HealthKit) or Google Health Connect, FitCreature reads the following health data from your device: sleep, steps, heart rate, active calories, body weight, body-fat percentage, and workouts recorded by other apps (including the distance, pace, duration, and route of cardio workouts).

All of this happens on your device. We compute your creature's mood and battle stats locally and never send your health or workout data to our servers to do it. We use this data only to reflect your daily activity in your creature's mood, to count cardio workouts (walks, hikes, runs, rides, swims) toward your creature's Endurance stat, and to show you reports and your per-workout heart-rate summary. We also write your manually logged workouts back to Apple Health or Health Connect so your training shows up in one place; we never write back workouts we imported from another app.

None of your health or fitness data is uploaded to our servers. Your workouts, sleep, steps, heart rate, active calories, and body metrics are processed entirely on your device. Only the resulting battle-stat scores (general 0 to 1 ratings used for matchmaking, described in Section 3.3) and a coarse, approximate area for Gym Zones ever leave your device.

We never use any health data for advertising, marketing, or data-mining, and we never share it with third parties for those purposes.

### 3.3 Information Sent to Our Servers

When you use the Services, the following is sent to and stored on our servers:

- Battle-stat scores. Your device computes eight battle-stat scores from your training, each a general rating between 0 and 1 (for example, an endurance rating), plus which stats are currently active. Only these derived scores are sent to our servers, where they are used to pair you with battle opponents and to run battles. The scores cannot be turned back into your workouts, health data, or any underlying measurement. Battle matchmaking never uses your location.
- Progress signals. So the game can grant rewards without reading your health data, the app sends small derived signals: your current and longest training-streak length, whether a given day had a workout, progress numbers for an active challenge, dates bridged by a streak freeze, reward claims (for example, that you met your daily move goal, completed a daily quest, or finished watching a rewarded ad), and the milestone events shown in your friends' activity feeds (for example, that you set a new personal record). These signals never include your workout contents, exercise names, health measurements, or body data.
- Approximate location (optional, off by default). If you enable location, your device first snaps the GPS fix to a grid of roughly 150 meters as a temporary on-device step, then converts it into a coarse area code covering an area roughly 5 kilometers across. Only that coarse area code is sent to and stored on our servers. We use it to place you in a regional Gym Zone and to run regional leaderboards. Once you have been placed in a regional Gym Zone, the app stops sending this area code; no location signal leaves your device again unless you need to be placed in a zone again. Your exact GPS coordinates are never stored or transmitted, battle matchmaking never uses your location, and no business or advertiser ever receives your location from us.
- Region selection. When you set or change your Gym Zone region by typing a city or zip code, the text you enter is sent to our mapping provider (OpenStreetMap) to find your general area. We store only the resulting approximate zone, not the city or zip you typed.
- Push notification token. When you enable push notifications, your device is assigned a registration token (a device-level identifier) through Firebase Cloud Messaging (a Google service); on Apple devices, notifications are relayed through Apple's Push Notification service (APNs). This token is stored on our servers and associated with your account, and we use it solely to deliver notifications you have enabled, such as battle results, season updates, and account alerts. We never use it to track you across apps or for advertising. You can disable notifications at any time in your device settings.
- Game activity. Creature state, battle history, season progress, cosmetic inventory, and your friend connections. We use this to run the game layer.
- Purchases and subscriptions. When you buy Power Bites or subscribe to Premium, we receive a record of the transaction from Apple or Google (never your card details) and store the transaction identifier, the product, the store environment, the amount, and what was credited. If you are a subscriber and gift the ad-free tier to a friend, we store who granted the gift, who received it, and its status.
- Basic connection information. Like any internet service, our servers receive your IP address when the app communicates with them as part of normal connection handling. We do not use it to build a profile of you. When ads are shown, Google separately receives your IP address as described in Section 5.2.

### 3.4 Information That Stays on Your Device or Is Never Collected

The following either never leaves your device or is never collected at all:

- Your full workout log (exercises, sets, reps, weights, durations, and notes), your exercise template library (the exercises you set up, with their names and notes), your body metrics (weight, body-fat percentage, measurements), and any food or nutrition entries. These are stored only on your device and are never uploaded to our servers.
- All of your health data (sleep, steps, heart rate, active calories) and your per-workout heart-rate summaries. None of it is uploaded to our servers.
- Progress photos and exercise photos. Your progress photos, and any photos you attach to a logged exercise, are stored only on your device. They are never uploaded to our servers.
- Workout GPS route maps. Routes on imported outdoor workouts are shown only on your device and never leave it.
- Your saved equipment-setup preferences for exercises. These are stored only on your device and are never uploaded to our servers.
- Precise GPS coordinates. Your device converts any location into a coarse, approximate-area code before anything leaves the device. Your exact coordinates are never stored or transmitted.
- Your login token. Held in your device's secure storage (iOS Keychain or Android Keystore-backed storage); it is never uploaded to our servers.

Because this data exists only on your device, it is not stored on our servers and cannot be restored by us if your device is lost. It is included in your device's encrypted backup (iCloud or Android backup) if you have that enabled; restoring that backup restores this data.

## 4. How We Use Your Information

We use the information we collect to:

- Provide, maintain, and improve the Services, including keeping your account and game state available when you sign in.
- Run the FitCreature game layer. Your battle stats are computed on your device; our servers use only the submitted scores to pair you with opponents, run battles, and show results. Our servers also apply plausibility checks to submitted scores to protect fair play.
- Form regional Gym Zones from coarse area codes so you can appear on regional leaderboards. Location is never used for battle matchmaking.
- Deliver push notifications you have enabled.
- Show advertising to users without an ad-free subscription (see Section 5.2), and grant rewards you claim from optional rewarded ads.
- Manage subscriptions, gifts, and purchases, including validating transactions with Apple and Google.
- Communicate with you about account issues, policy changes, and, if you opt in, product updates.
- Comply with legal obligations and enforce our Terms of Service.

## 5. How We Share Your Information

We share information only in the limited circumstances below.

### 5.1 Service Providers

We use infrastructure and service providers to operate FitCreature. We require every third party that receives any data from us, including any analytics tools, advertising networks, and third-party SDKs we use, to provide the same or equal protection of user data as stated in this policy:

- Supabase. Backend database, authentication, and edge functions (data hosting).
- Google (Firebase Cloud Messaging). Delivery of push notifications. Your device push token and notification content are processed through Google's infrastructure to route notifications to your device.
- Apple. On iOS, Firebase Cloud Messaging relays notifications to Apple's Push Notification service (APNs) to deliver them to your device.
- Apple and Google (purchase validation). If you buy Power Bites or subscribe, Apple (App Store) or Google (Google Play) processes the payment under their terms. We validate each transaction directly with Apple's App Store Server API or the Google Play Developer API; the transaction identifier crosses to Apple or Google for that validation. We never see or store your payment card details.
- OpenStreetMap (Nominatim). When a new Gym Zone is created, our server looks up a human-readable area name for it (for example, "Greater Austin Area"); only an approximate area coordinate is sent, with no user identifier. When you change your region by typing a city or zip code, that text is sent to Nominatim to find your general area and is then discarded.
- Resend. Delivery of the confirmation email when you sign up for the FitCreature beta at devtegra.com/beta. Your email address is processed by Resend solely to send that confirmation message.
- Cloudflare (Turnstile). The beta signup form uses Cloudflare Turnstile to distinguish humans from bots. Cloudflare receives the information needed to run that check (including your IP address and a challenge token). Turnstile is privacy-preserving; it is not used to track you across sites or to serve advertising.
- Cloud and hosting providers supporting the above services.

We do not share your personal data with third-party artificial intelligence systems, and we do not use your data to train AI models.

We will update this policy to reflect material changes to the service providers we use.

### 5.2 Advertising (Google AdMob)

FitCreature shows advertising to users without an ad-free subscription, served by Google AdMob. Ads are non-personalized: they are not based on your behavior across other apps or websites. To show ads and limit how often you see the same one, Google receives your device's advertising identifier where it is available on your platform and settings, your IP address (used for approximate location), and ad-interaction data, along with related diagnostics. You can review Google's practices at policies.google.com/technologies/ads.

None of your own FitCreature data is shared with the ad system: your health data, workouts, location, and account details never feed ad selection. EEA and UK users are asked for consent before any ad is shown. US-state residents can opt out of the sale or sharing of personal information through the Ad privacy options entry in the app's Settings (shown where these choices apply to you).

Subscribers, and friends they gift the ad-free tier to, are not shown ads. If you choose to watch an optional rewarded ad to earn in-game currency, we record that claim to grant the reward and enforce daily limits.

If we ever enable personalized ads, we will update this policy first and ask for the consent required in your region before any personalized ad is shown.

### 5.3 Other Users

Some information is visible to other FitCreature users by design:

- Your username, display name, creature appearance, and public profile stats are visible on leaderboards, battle recaps, and friend lists.
- Your Gym Zone association is visible to users in the same zone, unless you hide it in settings.
- Your friends may see milestone events in their activity feed, for example that you set a new personal record or extended a training streak. These events never name the exercise and never include weights, measurements, or any health data.
- Your exact workout contents (specific exercises, sets, weights, reps) are never visible to other users.

### 5.4 Legal and Safety

We may disclose information when required by law, subpoena, or court order; to protect the rights, safety, or property of Devtegra, our users, or the public; or in connection with a merger, acquisition, or sale of assets.

### 5.5 What We Do Not Do

- We do not sell your personal data.
- We do not share your personal data for cross-context behavioral advertising. Ads in FitCreature are non-personalized.
- We never give advertisers, partner businesses, or data brokers your health data, workouts, location, or contact information.

## 6. Data Retention

We retain your information for as long as your account is active or as needed to provide the Services. When you delete your account:

- Your account, profile, game state (creature, battle stats, currency, cosmetics), friend connections, push tokens, feedback, and subscription and gift records are deleted from our active systems as part of the deletion request.
- Purchase transaction records are retained with the link to your account removed, as the financial record we are required to keep (see the Data Deletion page for details).
- Emails and support messages you have sent us may remain in our support mailbox as a record of our correspondence; they are not automatically deleted with your account.
- Backups containing your data may persist for up to 90 days before they are overwritten in the normal course of backup rotation.
- Anonymized or aggregated data that cannot be used to identify you may be retained for analytics.
- Limited records may be retained longer where required by law (for example, financial records for tax or fraud-prevention purposes).

Data that lives only on your device (your workout log, exercise templates, equipment-setup preferences, health data, body metrics, food entries, and photos) is under your control: deleting the app, or deleting your account from within the app, removes it from your device.

You can request account deletion at any time. See Section 8.

## 7. Data Security

We use industry-standard safeguards to protect your data, which may include:

- Encryption of communication between the app and our servers in transit (HTTPS/TLS).
- Encryption of data stored on our backend at rest.
- Storage of authentication tokens in your device's secure storage (Keychain on iOS, EncryptedSharedPreferences on Android).
- Row-Level Security on our database so users can access only their own data.
- Hashing of passwords; we do not store plaintext passwords.

No security system is perfect. If we become aware of a breach that affects your personal information, we will notify you in accordance with applicable law.

### 7.1 Reporting a Security Issue

If you believe you have found a security vulnerability in FitCreature or our services, please email security@devtegra.com. Our coordinated vulnerability disclosure policy, including scope and safe-harbor terms for good-faith research, is published at https://devtegra.com/security.

## 8. Your Rights and Choices

### 8.1 Access, Correction, and Deletion

You can access and update most of your information directly in the FitCreature app, and the app's export feature saves your on-device data (workouts, body metrics, health summaries) to a file you control. To request a copy of the data we hold on our servers, to correct inaccuracies, or to delete your account and data, you can:

- Use the account deletion feature inside the FitCreature app.
- Visit devtegra.com/data-deletion and submit a request.
- Email us at contact.us@devtegra.com.

We will respond to verified requests within 30 days.

### 8.2 Location

You can disable location services for FitCreature at any time from your device settings. If disabled, you can still use the app; you just won't automatically join Gym Zones via location. You can join a zone manually using your city or zip code (the city or zip you type is used only to find your general area and is not stored).

### 8.3 Notifications

You can enable or disable push notifications at any time in your device settings. Disabling notifications does not affect your ability to use the rest of the app.

### 8.4 Advertising Choices

You can remove ads with the Premium subscription. EEA and UK users are shown a consent choice before any ad is served and can change it later through the Ad privacy options entry in the app's Settings. US-state residents can use the same Settings entry, where applicable, to opt out of the sale or sharing of personal information for ads.

### 8.5 Marketing Communications

If we send marketing emails, every email will include an unsubscribe link. Transactional emails (account security, purchase receipts, policy updates) will still be sent because they are necessary to operate your account.

### 8.6 Regional Rights

If you are in the European Economic Area, United Kingdom, or Switzerland (GDPR): You have rights to access, rectify, erase, restrict, and port your personal data, and to object to certain processing. You may also lodge a complaint with your local data protection authority.

If you are a California resident (CCPA/CPRA): You have the right to know what personal information we collect, to request deletion, to correct inaccurate information, and to opt out of the "sale" or "sharing" of personal information. We do not sell personal information. Ads in FitCreature are non-personalized; where an applicable opt-out right attaches to ad-related data, you can exercise it through the Ad privacy options entry in the app's Settings.

If you are a Washington resident: our Consumer Health Data Privacy Policy, describing how we handle consumer health data under the Washington My Health My Data Act, is available at devtegra.com/consumer-health-data-privacy.

Other US states (Virginia, Colorado, Connecticut, Utah, Texas, and others): You have similar rights under your state's privacy law. Contact us to exercise them.

To exercise any of these rights, email contact.us@devtegra.com.

## 9. Children's Privacy

FitCreature is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, contact us at contact.us@devtegra.com and we will delete the information.

In some jurisdictions (for example, the European Economic Area and the United Kingdom), the minimum age for consent is higher than 13. We do not knowingly collect personal information from users below the applicable minimum age in their region without appropriate consent from a parent or guardian.

## 10. International Data Transfers

Devtegra operates from the United States. If you use the Services from outside the United States, your information will be transferred to and processed in the United States or other countries where our service providers operate. These countries may have different data protection laws than your country of residence. Where required, we use appropriate safeguards (such as Standard Contractual Clauses) for international transfers.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. When we make changes, we will revise the "Last Updated" date above. Your continued use of the Services after the revised Policy becomes effective means you accept the changes. For material changes, we may also provide notice through the app or by email where required by applicable law.

## 12. Contact Us

Devtegra, LLC
Texas, United States
Email: contact.us@devtegra.com
