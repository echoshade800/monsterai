import { useRouter } from 'expo-router';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.contentText}>
Welcome, and thank you for your interest in Withfeeling Inc. ("MonsterAI," "we," or "us") and our website at mymonster.ai, along with our related websites, hosted applications, mobile or other downloadable applications, and other services provided by us (collectively, the "Service"). These Terms of Service are a legally binding contract between you and MonsterAI regarding your use of the Service.{'\n'}
{'\n'}
PLEASE READ THE FOLLOWING TERMS CAREFULLY:{'\n'}
 BY CLICKING "I ACCEPT," OR BY DOWNLOADING, INSTALLING, OR OTHERWISE ACCESSING OR USING THE SERVICE, YOU AGREE THAT YOU HAVE READ AND UNDERSTOOD, AND, AS A CONDITION TO YOUR USE OF THE SERVICE, YOU AGREE TO BE BOUND BY THESE TERMS AND MONSTERAI'S PRIVACY POLICY (TOGETHER, THE "TERMS"). IF YOU ARE NOT ELIGIBLE, OR DO NOT AGREE, YOU MAY NOT USE THE SERVICE.{'\n'}
{'\n'}
ARBITRATION NOTICE. Except for certain kinds of disputes described in Section 17, you agree that disputes arising under these Terms will be resolved by binding, individual arbitration, and BY ACCEPTING THESE TERMS, YOU AND MONSTERAI WAIVE THE RIGHT TO A JURY TRIAL OR TO PARTICIPATE IN A CLASS ACTION OR REPRESENTATIVE PROCEEDING. See Section 17.{'\n'}
{'\n'}
1. MonsterAI Service Overview.{'\n'}
The Service enables users to interact with other users (e.g., watch videos, listen to music, upload content, video/voice chat). You acknowledge MonsterAI is not in control of content posted by users. You are solely responsible for what you share.{'\n'}
{'\n'}
2. No Spam.{'\n'}
You agree not to send unsolicited marketing messages or broadcasts via the Service. Suspect spam? Email support@mymonster.ai.{'\n'}
{'\n'}
3. Eligibility.{'\n'}
You must be at least 13 to use the Service. If under 18, a parent/guardian must accept these Terms and supervise your use. You affirm you're not previously suspended and your use complies with applicable laws.{'\n'}
{'\n'}
4. Accounts and Registration.{'\n'}
Register to access most features. Provide accurate, complete information and keep it updated. You're responsible for your credentials and all activity under your account. If your account is compromised, notify support@mymonster.ai immediately.{'\n'}
{'\n'}
5. Licenses.{'\n'}
Limited License. Subject to compliance, MonsterAI grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to install one copy of any authorized app and to access/use the Service for personal, non-commercial use.{'\n'}
{'\n'}
Restrictions. Except as permitted by law: do not reproduce, distribute, publicly display/perform, modify, or create derivatives of the Service; or interfere with security/access controls.{'\n'}
{'\n'}
Feedback. You grant MonsterAI a perpetual, irrevocable, royalty-free license to use Feedback for any purpose without obligation of attribution.{'\n'}
{'\n'}
6. Ownership; Proprietary Rights.{'\n'}
The Service and all related materials ("Materials") are owned by MonsterAI or its licensors and protected by law. No implied licenses are granted.{'\n'}
{'\n'}
7. Third-Party Terms.{'\n'}
Third-Party Services & Links. Tools may let you export info (including User Content) to third-party services. By using them, you authorize transfer to those services. They're not under MonsterAI's control; review their terms/policies.{'\n'}
{'\n'}
Third-Party Software. Third-party components may be included under their own licenses. Nothing here limits your rights under those licenses.{'\n'}
{'\n'}
8. User Content.{'\n'}
General. Some features let you submit, upload, publish, broadcast, or transmit ("Post") content ("User Content"). You retain rights you hold in your User Content, subject to licenses below.{'\n'}
{'\n'}
License to MonsterAI. You grant MonsterAI a worldwide, non-exclusive, irrevocable, royalty-free, fully paid, sublicensable license to host, store, transfer, display, perform (including digital audio transmission), communicate, reproduce, reformat, create derivatives as authorized by these Terms, and distribute your User Content in any media.{'\n'}
{'\n'}
License to Other Users. If your User Content is made available to others, you grant them a non-exclusive license to access and use it as permitted by these Terms and Service functionality.{'\n'}
{'\n'}
Photos/Images. If a posted image includes people, you grant those persons (and applicable representatives) a perpetual, royalty-free, worldwide license to reproduce, distribute, and publicly display the image for personal use via online platforms, but not to promote third-party products/services.{'\n'}
{'\n'}
Music. If you're subject to a PRO/publisher/label, ensure you have rights to grant the licenses herein and fulfill reporting/consent obligations. You're responsible for securing rights for covers.{'\n'}
{'\n'}
Your Representations. You have the rights to post the content; it won't infringe others' rights or require payments by MonsterAI; and it isn't unlawful or inappropriate.{'\n'}
{'\n'}
Disclaimer & Monitoring. MonsterAI isn't obligated to edit or control User Content, but may remove, edit, block, filter, mute, or disable access at any time. We may monitor transmissions; monitoring creates no duty or liability. Use is governed by our Privacy Policy.{'\n'}
{'\n'}
9. Communications.{'\n'}
Text Messaging. MonsterAI and its agents may send SMS to numbers you provide (operational/marketing). Standard rates may apply. To opt out, email support@mymonster.ai or use in-app settings (you may receive a brief confirmation).{'\n'}
{'\n'}
Push Notifications. You agree to receive push notifications; disable them in device settings.{'\n'}
{'\n'}
Email. We may email you about products/services (ours or third-party). Opt out via the unsubscribe link.{'\n'}
{'\n'}
10. Prohibited Conduct.{'\n'}
You agree not to:{'\n'}
- use the Service illegally or to violate laws;{'\n'}
- harass, threaten, bully, or harm users;{'\n'}
- infringe or encourage infringement of third-party rights;{'\n'}
- access/search the Service via unauthorized automated means;{'\n'}
- bypass or interfere with security or access controls;{'\n'}
- disrupt the Service or users (e.g., malware, unsolicited offers, scraping personal data, network disruption);{'\n'}
- engage in fraud (impersonation, false affiliation, unauthorized access, falsifying age/DOB);{'\n'}
- sell/transfer access or Materials; or{'\n'}
- attempt or assist others to do any of the above.{'\n'}
{'\n'}
11. Intellectual Property Rights Protection.{'\n'}
Respect for Rights. Infringing activity is not tolerated.{'\n'}
{'\n'}
DMCA Notice (Designated Agent).{'\n'}
 If you believe material on the Service infringes your IP, email our Designated Agent at support@mymonster.ai with a valid "Notification of Claimed Infringement" including:{'\n'}
 (i) your physical/electronic signature; (ii) identification of the work claimed infringed; (iii) identification of the allegedly infringing material and its location; (iv) your email; (v) a good-faith statement that the use is unauthorized; and (vi) a statement under penalty of perjury that the notice is accurate and you are authorized to act.{'\n'}
 MonsterAI may share your notice with the user and public databases that track notices.{'\n'}
{'\n'}
Repeat Infringers. We may remove/disable material and terminate accounts of repeat or egregious infringers.{'\n'}
{'\n'}
Counter Notice. If your material was removed, you may email a counter notice including: (i) your signature; (ii) identification of the removed material and where it appeared; (iii) a statement under penalty of perjury that the removal was a mistake/misidentification; and (iv) your name and email plus consent to jurisdiction as required by 17 U.S.C. §512.{'\n'}
{'\n'}
Reposting. Unless the complainant files an action, MonsterAI may restore content 10–14 business days after receiving a valid counter notice.{'\n'}
{'\n'}
False Notices. 17 U.S.C. §512(f) provides liability for knowing misrepresentations in notices/counter notices. We reserve the right to seek damages for violations.{'\n'}
{'\n'}
12. Modification of Terms.{'\n'}
We may update these Terms. Changes are effective immediately, except material changes for existing users become effective 30 days after posting or notice unless stated otherwise. We may require acceptance of modified Terms to continue using the Service. If you disagree, discontinue use. Other amendments require written agreement signed by authorized representatives.{'\n'}
{'\n'}
13. Term, Termination, and Modification of the Service.{'\n'}
Term. Effective when you accept or first use the Service, until terminated.{'\n'}
{'\n'}
Termination. Violation of these Terms automatically terminates your authorization. We may suspend/terminate your account or access at any time for any reason or no reason. You may terminate at any time by emailing support@mymonster.ai.{'\n'}
{'\n'}
Effect. Upon termination: (a) your license ends and you must stop using the Service; (b) your access/account ends; (c) you must pay any amounts due; and (d) Sections 5 (Feedback), 6, 8.2–8.3, 11, 13.3, 14–19 survive. Retain copies of your User Content; you may lose access after termination. If terminated for breach, you may not create a new account.{'\n'}
{'\n'}
Service Changes. We may modify or discontinue any part of the Service at any time without liability. Retain copies of content you post.{'\n'}
{'\n'}
14. Indemnity.{'\n'}
To the fullest extent permitted by law, you will defend and indemnify Withfeeling Inc. and its affiliates/officers/directors/employees/agents ("MonsterAI Entities") from third-party claims and related liabilities, damages, losses, and expenses (including attorneys' fees) arising from: (a) your unauthorized use/misuse; (b) your violation of these Terms or law; (c) your violation of third-party rights; or (d) disputes between you and third parties. We may assume exclusive defense; you will cooperate.{'\n'}
{'\n'}
15. Disclaimers; No Warranties by MonsterAI.{'\n'}
THE SERVICE AND ALL MATERIALS/CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE." MONSTERAI DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, NON-INFRINGEMENT, AND ANY ARISING FROM COURSE OF DEALING/USAGE. WE DO NOT WARRANT UNINTERRUPTED, SECURE, OR ERROR-FREE SERVICE OR THAT DEFECTS WILL BE CORRECTED. USE AT YOUR OWN RISK.{'\n'}
{'\n'}
16. Limitation of Liability.{'\n'}
TO THE FULLEST EXTENT PERMITTED BY LAW, THE MONSTERAI ENTITIES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR INTANGIBLE LOSSES, OR LOST PROFITS/GOODWILL, ARISING FROM OR RELATED TO YOUR ACCESS/USE OR INABILITY TO ACCESS/USE THE SERVICE OR MATERIALS/CONTENT, WHETHER BASED ON WARRANTY, CONTRACT, TORT, STATUTE, OR ANY OTHER THEORY, EVEN IF ADVISED OF THE POSSIBILITY.{'\n'}
{'\n'}
EXCEPT AS PROVIDED IN SECTIONS 17.5–17.6, THE MONSTERAI ENTITIES' AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS IS LIMITED TO THE GREATER OF: (a) AMOUNTS YOU PAID TO MONSTERAI FOR THE SERVICE IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR (b) US$100. EACH LIMITATION/EXCLUSION/DISCLAIMER ALLOCATES RISK AND IS ESSENTIAL TO THE BASIS OF THE BARGAIN.{'\n'}
{'\n'}
17. Dispute Resolution and Arbitration.{'\n'}
Generally. Except as in Sections 17.2–17.3, any dispute arising in connection with these Terms, the Service, or our communications will be resolved by binding arbitration under the Federal Arbitration Act and administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules ("AAA Rules"), as modified by these Terms. YOU AND MONSTERAI WAIVE JURY TRIAL AND CLASS ACTION.{'\n'}
{'\n'}
Exceptions. These Terms do not waive rights to: (a) bring an individual small-claims action; (b) pursue agency enforcement; (c) seek injunctive relief in court in aid of arbitration; or (d) file in court for IP infringement claims.{'\n'}
{'\n'}
Opt-Out. You may opt out of arbitration within 30 days after agreeing to these Terms by emailing support@mymonster.ai with subject "Arbitration Opt-Out," and including your full legal name and the account email. Upon our receipt, Section 17 no longer applies; Section 18.2 governs disputes in court.{'\n'}
{'\n'}
Arbitrator. The arbitrator has exclusive authority over enforceability, scope, and interpretation of this arbitration agreement. AAA Rules and filing forms are available at www.adr.org.{'\n'}
{'\n'}
Notice of Arbitration; Process. To start arbitration, first email a written Notice of Arbitration to support@mymonster.ai describing the claim and the specific relief sought ("Demand"). If unresolved within 30 days after our receipt, either party may commence arbitration. Proceedings are confidential unless agreed otherwise. Settlement offers must not be shown to the arbitrator until after a final decision.{'\n'}
{'\n'}
Fees. If you commence arbitration consistent with these Terms, MonsterAI will reimburse your filing fee unless your claim exceeds US$10,000, in which case fees follow AAA Rules. For claims up to US$10,000, you may choose: (a) documents-only; (b) teleconference; or (c) in-person per AAA Rules. If the arbitrator finds your claim frivolous or improper, fees follow AAA Rules and you agree to reimburse MonsterAI for monies otherwise your obligation.{'\n'}
{'\n'}
No Class Actions. Claims may be brought only in an individual capacity; no consolidated or representative proceedings without both parties' consent.{'\n'}
{'\n'}
Modifications. If we change this arbitration provision (except the contact email), you may reject it via email within 30 days to support@mymonster.ai; your account will be terminated and the prior arbitration terms will survive.{'\n'}
{'\n'}
Enforceability. If Section 17.7 or this entire Section 17 is unenforceable, or if you opt out, Section 18.2 governs venue/jurisdiction.{'\n'}
{'\n'}
18. Miscellaneous.{'\n'}
General. These Terms (plus the Privacy Policy and any Additional Terms) are the entire agreement. You may not assign without our consent; we may assign at any time. Failure to enforce isn't a waiver. Headings are for convenience. "Including" means "including but not limited to." If any part is invalid, the remainder stays in force.{'\n'}
{'\n'}
Governing Law. Delaware law governs, without regard to conflicts rules. You and MonsterAI submit to the personal and exclusive jurisdiction of the state and federal courts located in Wilmington, New Castle County, Delaware for permitted court proceedings.{'\n'}
{'\n'}
Privacy Policy. See the MonsterAI Privacy Policy for details on how we handle personal data; it is incorporated into these Terms.{'\n'}
{'\n'}
Additional Terms. Features or services may be subject to Additional Terms posted or linked within the Service; they are incorporated herein.{'\n'}
{'\n'}
Consent to Electronic Communications. By using the Service, you consent to receive electronic communications from us as described in the Privacy Policy. Electronic notices satisfy legal requirements for "written" communications.{'\n'}
{'\n'}
Contact Information. For any questions about the Service or these Terms, email support@mymonster.ai.{'\n'}
{'\n'}
No Support. We have no obligation to provide support. Where offered, support follows published policies.{'\n'}
{'\n'}
International Use. The Service is intended for U.S. visitors. We make no representation that it is appropriate or available elsewhere. Access where illegal is prohibited.{'\n'}
{'\n'}
19. Notice Regarding Apple.{'\n'}
If you use our iOS app: these Terms are between you and MonsterAI, not Apple. Apple isn't responsible for the Service/content and has no maintenance/support obligations. If the app fails to conform to applicable warranties, you may notify Apple for a refund of the purchase price (if any). Apple isn't responsible for claims relating to the Service, including product liability, legal/regulatory compliance, or consumer-protection claims, nor for third-party IP claims. Apple and its subsidiaries are third-party beneficiaries and may enforce these Terms. You represent that you are not located in an embargoed country and are not on any prohibited parties list.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
