import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#050807] text-[#a0a0a0] p-6 font-mono">
      <div className="max-w-3xl mx-auto border border-[#1a3a1a] p-8 bg-black/50">
        <h1 className="text-2xl text-[#00ff00] mb-6 uppercase tracking-widest">[ Privacy Policy ]</h1>
        <h2 className="text-xl text-[#00ff00] mb-6">PRIVACY POLICY</h2>
        
        <p className="mb-4">Last updated: {new Date().toLocaleDateString('en-US')}</p>

        <h3 className="text-lg text-[#00ff00] mt-6 mb-2">1. Introduction</h3>
        <p className="mb-4">
          Welcome to SpyMe ("we", "our", or "us"). This Privacy Policy explains how we collect, use, and protect your personal information when you use our mobile application (the "App").
        </p>

        <h3 className="text-lg text-[#00ff00] mt-6 mb-2">2. Information We Collect</h3>
        <p className="mb-2">We collect the following types of information:</p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Account Information:</strong> When you register, we collect your Name, Email address, and Password (encrypted).</li>
          <li><strong>Third-Party Auth Data:</strong> If you log in via Yandex or VK, we receive your basic profile information (Name, Email, Avatar) from these services.</li>
          <li><strong>Game Data:</strong> Your in-game progress, balance, role, and activity within the App.</li>
          <li><strong>Device Information:</strong> We may collect basic device data for analytics and crash reporting.</li>
        </ul>

        <h3 className="text-lg text-[#00ff00] mt-6 mb-2">3. How We Use Your Information</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>To create and manage your account.</li>
          <li>To provide and improve the game experience.</li>
          <li>To communicate with you regarding updates or support.</li>
        </ul>

        <h3 className="text-lg text-[#00ff00] mt-6 mb-2">4. Data Sharing and Storage</h3>
        <p className="mb-4">
          We use <strong>Supabase</strong> as our backend service provider. Your data is stored securely on Supabase servers. We do not sell your personal data to third parties. We may share data only if required by law.
        </p>

        <h3 className="text-lg text-[#00ff00] mt-6 mb-2">5. Data Deletion</h3>
        <p className="mb-4">
          You have the right to delete your account and personal data at any time. <strong>You can delete your account directly inside the App by going to your Account Settings and clicking the "Delete account" button.</strong> Alternatively, you can contact us at support@spyme.com.ru. Upon request, we will delete your data from our systems within 30 days.
        </p>

        <h3 className="text-lg text-[#00ff00] mt-6 mb-2">6. Security</h3>
        <p className="mb-4">
          We take reasonable measures to protect your data. However, no method of transmission over the internet is 100% secure.
        </p>

        <h3 className="text-lg text-[#00ff00] mt-6 mb-2">7. Contact Us</h3>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact us at: <br/>
          <strong>Email:</strong> support@spyme.com.ru
        </p>
      </div>
    </div>
  );
}