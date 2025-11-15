import { useRouter } from 'expo-router';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.contentText}>
Privacy Policy{'\n'}
Welcome to MonsterAI, provided and controlled by Withfeeling Inc. ("MonsterAI," "we," "our," and/or "us"). We value the privacy of individuals who use our website, mobile app, and related services (collectively, our "Services"). This privacy policy (the "Privacy Policy") explains how we collect, use, and share information from or about MonsterAI users ("Users") or their devices. By using our Services, you agree to the collection, use, disclosure, and procedures this Privacy Policy describes. Beyond the Privacy Policy, your use of our Services is also subject to our Terms of Service.{'\n'}
{'\n'}
Information We Collect{'\n'}
We may collect a variety of information from or about you or your devices from various sources, as described below.{'\n'}
{'\n'}
A. Information You Provide to Us{'\n'}
Registration and Profile Information. When you sign up for an account, we ask you for your name, phone number, date of birth, photos of you, and any other information we collect. You may add additional profile info such as a profile picture, bio, stories, and questions for friends. If you sign up using a social media account, we will receive information from those services such as your name, email address, date of birth, photos, and friends who are using MonsterAI.{'\n'}
{'\n'}
Communications. When you communicate with us (e.g., Customer Support), we may receive your name, email address, phone number, message contents, attachments, and any other info you provide.{'\n'}
{'\n'}
Careers. If you apply for a job, we collect the information you provide on your resume (e.g., education and employment history).{'\n'}
{'\n'}
B. Information We Collect When You Use Our Services{'\n'}
Usage Information. We automatically receive information about your interactions with our Services, like the rooms you visit, timestamps, searches you conduct, and people you follow.{'\n'}
{'\n'}
User Content. We receive any content that you post or share, including comments, photos, videos, and screen activity.{'\n'}
{'\n'}
Facial Data. When you upload photos, we collect and store the images and associated metadata, including facial data derived from the photo.{'\n'}
{'\n'}
Messages. We process information you provide when you compose, send, or receive messages (including direct messages and in-room messages), such as content, timestamps, read status, and participants.{'\n'}
{'\n'}
Audio and Video Information. We may scan, analyze, and review audio and video streams in rooms to maintain integrity, prevent abuse, and support safety and security.{'\n'}
{'\n'}
Your Contacts. With your permission, we may access and store names and contact info from your device's address book to facilitate invitations and social features. We also collect contacts you invite to MonsterAI or share content with.{'\n'}
{'\n'}
Device Information. We receive information about the device and software you use to access our Services, including IP address (which may infer general location), browser type, OS version, carrier and manufacturer, app installations, device identifiers, mobile advertising identifiers, and push tokens.{'\n'}
{'\n'}
Information from Cookies and Similar Technologies. We and our third-party partners use cookies, pixel tags, and similar technologies to collect information about your activities over time and across services. You can manage cookie settings in your browser; disabling cookies may limit functionality.{'\n'}
{'\n'}
C. Information We Receive from Third Parties{'\n'}
Information from third-party services. If you link a third-party account, we may receive your profile info, photos/videos, and friends who use MonsterAI. Manage these in the third-party's privacy settings.{'\n'}
{'\n'}
Other third parties. We may receive additional information (e.g., demographic data) from data/marketing partners and combine it with information we have.{'\n'}
{'\n'}
How We Use the Information We Collect{'\n'}
We use information to:{'\n'}
- Provide, maintain, improve, and enhance our Services;{'\n'}
- Communicate with you, provide updates and information you request, and deliver support;{'\n'}
- Market and provide promotional/advertising materials that may be useful or relevant to you;{'\n'}
- Personalize your experience (e.g., tailored content, creating interactive movies with your face);{'\n'}
- Send text messages and push notifications;{'\n'}
- De-identify or aggregate information for any lawful purpose;{'\n'}
- Detect and prevent fraud and address trust/safety issues;{'\n'}
- Comply with legal obligations and enforce our Terms of Service; and{'\n'}
- Achieve other purposes disclosed at collection time.{'\n'}
{'\n'}
How We Share the Information We Collect{'\n'}
We may share information with:{'\n'}
- Vendors and Service Providers;{'\n'}
- Publicly Available User Profile (e.g., name, username, bio, stories viewable/searchable by other users);{'\n'}
- Content You Share (by default, messages, comments, streaming selections, audio/video displayed or broadcast on the Services);{'\n'}
- Third-Party App Integrations (e.g., user identifiers, device info, IP address where relevant);{'\n'}
- Analytics Partners (e.g., Google Analytics; see Google's practices and opt-out tools);{'\n'}
- Advertising Partners (who may use cookies/pixels; see NAI/DAA/AppChoices opt-outs; SMS-related data is not shared with third parties);{'\n'}
- Affiliates (for purposes described in this Policy; SMS-related data is not shared with third parties);{'\n'}
- As Required by Law (e.g., lawful requests, safety, rights protection);{'\n'}
- Merger, Sale, or Other Asset Transfers;{'\n'}
- With Your Consent.{'\n'}
{'\n'}
Your Choices{'\n'}
Sharing Preferences. Manage visibility of certain information in your account settings (e.g., default room access, Hangout History visibility, call invitations).{'\n'}
{'\n'}
Contacts. Use your device OS settings to enable/disable contact sharing.{'\n'}
{'\n'}
Marketing Communications. Unsubscribe via links in promotional emails. You will still receive administrative messages.{'\n'}
{'\n'}
Third Parties{'\n'}
Our Services may contain links to third-party sites/products/services. Their privacy practices are their own. Review their policies before sharing information.{'\n'}
{'\n'}
Security{'\n'}
We use reasonable physical and electronic safeguards. However, as the Services are hosted electronically, we cannot guarantee absolute security.{'\n'}
{'\n'}
Additional Information for California Residents{'\n'}
As required by the CCPA, we disclose the categories of personal information collected and disclosed where we determine the purposes and means of processing: Contact Information and Identifiers; Customer Records; Commercial Information; Internet or Other Electronic Network Activity Information; Visual and Audio Information; and Professional/Employment Information. See "Information We Collect" and "How We Use the Information We Collect" for sources and purposes.{'\n'}
 We share data with: other MonsterAI users (subject to your settings), integrated third parties, service providers/vendors, and third parties for legal/safety purposes.{'\n'}
 Categories disclosed for a business purpose may include the foregoing categories to the listed recipients.{'\n'}
{'\n'}
CCPA Rights (if you are a California resident):{'\n'}
- Access a copy of personal information we collected in the prior 12 months;{'\n'}
- Request details about categories of personal information, sources, purposes, and third parties;{'\n'}
- Request deletion (subject to exemptions);{'\n'}
- Opt-out of sale of personal information (we do not sell personal information);{'\n'}
- Freedom from discrimination for exercising CCPA rights.{'\n'}
{'\n'}
Submit access/deletion requests by emailing support@mymonster.ai or through your account settings for deletion requests made in-app. Authorized agents may email support@mymonster.ai with written authorization; we may require direct identity verification. If a government ID copy is collected for verification, we delete it within 30 days after review unless stated otherwise.{'\n'}
{'\n'}
We store data until it's no longer necessary to provide Services/products or until your account is deleted, while retaining certain information as needed for record-keeping, transactions, or legal obligations.{'\n'}
{'\n'}
Children's Privacy{'\n'}
We do not knowingly collect personal information from children under 13, and our Services are not directed to them. If we become aware of such collection, we will delete the information and terminate the account. Parents may contact support@mymonster.ai.{'\n'}
{'\n'}
International Visitors{'\n'}
Our Services are hosted in the United States and other countries. If you use the Services from regions with different data laws (e.g., EU), you consent to the transfer, storage, and processing of your information in the U.S. and other regions.{'\n'}
{'\n'}
Update Your Information or Pose a Question{'\n'}
You can update profile information or close your account in your profile settings. For questions about your privacy or this Privacy Policy, contact support@mymonster.ai.{'\n'}
{'\n'}
Changes to this Privacy Policy{'\n'}
We will post updates on this page. Revised versions are effective when posted. For material changes to prior practices, we will notify you via the Services, email, or other communication.{'\n'}
{'\n'}
Contact Information{'\n'}
Questions, comments, or concerns about our processing activities? Email support@mymonster.ai.
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
