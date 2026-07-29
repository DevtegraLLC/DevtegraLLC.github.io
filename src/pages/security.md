---
layout: ../layouts/LegalLayout.astro
title: "Security"
description: "How Devtegra secures FitCreature and devtegra.com, and how to report a security vulnerability."
---

# Security Vulnerability Disclosure Policy

Effective Date: June 20, 2026
Last Updated: July 29, 2026

Devtegra, LLC ("Devtegra," "we," "us," or "our") welcomes reports from security researchers and members of the public who discover potential vulnerabilities in our products, including the FitCreature mobile app and its backend services. This policy explains what is in scope, how to report a problem, what we ask of you, and the limited authorization we extend to good-faith research. Please read it in full before you begin. By submitting a report or conducting research on our systems, you agree to this policy.

## How to report

Email security@devtegra.com with a description of the issue. Where you can, please include:

- The product or URL affected.
- Steps to reproduce, a proof of concept, or a short screen recording.
- The impact you believe the issue has.
- Any suggested remediation, if you have one.

You do not need an account or prior permission to report. If you would prefer to send an encrypted message, say so in a first plain message and we will arrange a channel.

## What we ask of you

To stay within this policy, you must:

- Give us a reasonable time to investigate and fix an issue before disclosing it to anyone else. Our default coordinated disclosure window is 90 days from the date we acknowledge your report. Do not disclose any part of an issue publicly or to a third party before that window ends without our prior written consent. We may ask for a reasonable extension where a fix needs more time.
- Only interact with accounts you own or have explicit written permission to test. Do not access, modify, or delete data that belongs to anyone else.
- If you encounter another person's personal data while investigating an issue, stop, do not download, copy, or retain it, limit your access to the minimum needed to demonstrate the finding, and tell us in your report. Accessing, exfiltrating, or retaining personal data beyond that is not authorized and falls outside the protections in this policy.
- Do not degrade our service or our providers' services. No denial of service testing, no automated scanning that generates high traffic, no spam, and no social engineering of our staff, our providers, or our users.
- Do not exploit an issue beyond the minimum needed to demonstrate it, and do not use an issue to pivot to other systems or data.
- Comply with all applicable laws, and with this policy.

If you do not meet these conditions, the authorization and safe harbor below do not apply to your activity.

## Authorization and safe harbor

If you make a good-faith effort to follow this policy, Devtegra will:

- Consider your research authorized under the Computer Fraud and Abuse Act and consistent state computer crime laws, and authorized with respect to anti-circumvention provisions such as Section 1201 of the Digital Millennium Copyright Act, to the extent your testing reasonably requires it.
- Not bring or support a legal claim against you under those laws, or for breach of our Terms of Service, arising from good-faith research within the Scope below.
- If a third party brings a claim against you for activity we authorized under this policy, take reasonable steps to make clear that your research was authorized.
- Handle your report as described in "How we handle your report" below.

This authorization is limited. It applies only to the systems listed under Scope, only while you act in good faith, and only to claims that Devtegra itself can bring or control. Devtegra may suspend or revoke this authorization at any time. The safe harbor does not:

- Waive or limit the rights of any third party, including Apple, Google, Supabase, Firebase, or our hosting providers, or authorize you to access or test their systems.
- Authorize any violation of applicable criminal law.
- Protect activity that goes beyond good-faith research, including accessing, downloading, retaining, or exfiltrating another person's data, degrading the Service, demanding payment in exchange for withholding or disclosing a finding, or any other conduct that does not comply with this policy.

Devtegra will make a good-faith determination of whether your conduct met the conditions of this policy. Nothing in this policy limits Devtegra's rights or remedies with respect to conduct that falls outside it, and Devtegra reserves all of those rights.

## Scope

In scope:

- The FitCreature mobile application (iOS and Android).
- The FitCreature application backend that we control (our Supabase project: database, Edge Functions, and authentication).
- devtegra.com and its subdomains.

Out of scope:

- Third-party services and infrastructure we rely on, including Supabase, Apple, Google, Firebase, and our website host. Our backend runs on Supabase and devtegra.com is hosted by a third-party provider. Our authorization covers your good-faith testing of the application layer and the data and functionality we control. It does not authorize testing of the underlying provider infrastructure itself, and you remain responsible for complying with those providers' terms. Report issues in a provider's own systems to that provider.
- Findings that require a rooted or jailbroken device, a physically stolen and unlocked phone, or a compromised local account, where the user is attacking only their own device. FitCreature is offline first, and game scores are computed on the user's own device by design. Currency and paid state are server-authoritative and are restored on the next sync if tampered with locally. A user manipulating their own submitted game scores is a fair-play matter handled by server-side plausibility checks and our Terms of Service, not a security vulnerability, and local-only tampering with your own data is a known and accepted design boundary.
- Reports from automated tools without a demonstrated, exploitable impact.
- Missing security headers, best-practice suggestions, or theoretical issues with no realistic attack path, unless you can show concrete impact.

If you are unsure whether something is in scope, ask us before you test it.

## How we handle your report

- We aim to acknowledge your report within 5 business days. This is a goal, not a commitment.
- We will let you know whether we can reproduce the issue and keep you reasonably informed as we work on a fix.
- We treat reports as confidential and will not share your identity outside Devtegra without your permission, except where we are required to do so by law or valid legal process, or where limited disclosure to a service provider, advisor, or insurer is necessary to investigate or fix the issue.
- Your report and any materials you submit are provided to Devtegra on a non-confidential and non-proprietary basis. You grant Devtegra a perpetual, irrevocable, worldwide, royalty-free license to use them for any purpose, including investigating and remediating the issue and improving our security. Submitting a report does not create any obligation for Devtegra to respond, to act, or to compensate you, and does not transfer any of your other rights.
- When an issue is resolved, we are glad to credit you publicly if you would like that. Crediting is at our discretion.

We do not currently run a paid bug bounty program. Reports are handled on a goodwill basis, and you should not expect payment. This may change in the future, and if we introduce paid rewards we will publish separate terms.

## Eligibility

To participate, you must have the legal capacity to agree to this policy, and you must comply with all applicable export-control and sanctions laws. You represent that you are not located in an embargoed jurisdiction and are not on any government sanctions or denied-party list.

## Your other obligations as a user

Our Terms of Service continue to apply to your use of the Services while you research, including the disclaimers, the limitation of liability, and the indemnification provisions, except where the authorization and safe harbor above expressly apply. This policy creates no contract, employment, agency, or partnership relationship between you and Devtegra.

## No warranty

The Services are provided "as is" for purposes of your research. Devtegra makes no warranty in connection with this policy or your participation, and the timelines stated here are goals rather than binding commitments.

## Governing law

This policy, and any dispute relating to your participation in it, is governed by the laws of the State of Texas, without regard to its conflict-of-laws principles. The exclusive venue for any such dispute is the state and federal courts located in Travis County, Texas, and you consent to the personal jurisdiction of those courts. Devtegra may seek injunctive relief in any court of competent jurisdiction.

## Changes to this policy

We may update this policy at any time. The version published on this page at devtegra.com/security is the authoritative version. Your continued participation after we post changes means you accept them.

Devtegra, LLC
Texas, United States
