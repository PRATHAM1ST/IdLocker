/**
 * Dummy data for development/testing purposes
 * This file provides sample vault items for UI testing
 *
 * Images are from Lorem Picsum (https://picsum.photos) - free public placeholder images
 */

import type { VaultItem, ImageAttachment } from '../utils/types';

// Generate consistent UUIDs for dummy data
const generateId = (prefix: string, index: number): string =>
  `${prefix}-${String(index).padStart(4, '0')}-dummy-4xxx-yxxx-xxxxxxxxxxxx`;

const now = new Date().toISOString();
const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

/**
 * Create a dummy image attachment using Lorem Picsum
 * Uses seed-based URLs for consistent images across sessions
 */
const createDummyImage = (
  seed: string,
  width: number,
  height: number,
  filename: string,
  createdAt: string = oneMonthAgo,
): ImageAttachment => ({
  id: `img-${seed}-${Date.now()}`,
  uri: `https://picsum.photos/seed/${seed}/${width}/${height}`,
  filename,
  width,
  height,
  createdAt,
});

export const DUMMY_VAULT_ITEMS: VaultItem[] = [
  // Bank Accounts
  {
    id: generateId('bank', 1),
    type: 'bankAccount',
    label: 'HDFC Savings Account',
    fields: {
      bankName: 'HDFC Bank',
      accountHolder: 'John Doe',
      accountNumber: '50100123456789',
      accountType: 'savings',
      ifsc: 'HDFC0001234',
      swift: 'HDFCINBB',
      branch: 'Koramangala, Bangalore',
      notes: 'Primary salary account',
    },
    images: [
      createDummyImage('hdfc-passbook', 800, 600, 'passbook_front.jpg', twoMonthsAgo),
      createDummyImage('hdfc-cheque', 800, 400, 'cancelled_cheque.jpg', twoMonthsAgo),
    ],
    createdAt: twoMonthsAgo,
    updatedAt: oneMonthAgo,
  },
  {
    id: generateId('bank', 2),
    type: 'bankAccount',
    label: 'ICICI Current Account',
    fields: {
      bankName: 'ICICI Bank',
      accountHolder: 'John Doe Business',
      accountNumber: '001105012345',
      accountType: 'current',
      ifsc: 'ICIC0000011',
      branch: 'MG Road, Bangalore',
      notes: 'Business account for invoicing',
    },
    createdAt: twoMonthsAgo,
    updatedAt: twoMonthsAgo,
  },
  {
    id: generateId('bank', 3),
    type: 'bankAccount',
    label: 'SBI Fixed Deposit',
    fields: {
      bankName: 'State Bank of India',
      accountHolder: 'John Doe',
      accountNumber: 'FD2024001234567',
      accountType: 'fixed',
      ifsc: 'SBIN0005678',
      branch: 'Indiranagar, Bangalore',
      notes: 'FD maturity date: Dec 2025',
    },
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
  },

  // Cards
  {
    id: generateId('card', 1),
    type: 'card',
    label: 'HDFC Credit Card',
    fields: {
      cardNickname: 'HDFC Regalia',
      brand: 'visa',
      lastFourDigits: '4532',
      expiryMonth: '09',
      expiryYear: '2027',
      cardholderName: 'JOHN DOE',
      billingAddress: '123 Tech Park, HSR Layout\nBangalore 560102',
      notes: 'Primary credit card - Rewards points',
    },
    images: [
      createDummyImage('hdfc-card-front', 800, 500, 'card_front.jpg', twoMonthsAgo),
      createDummyImage('hdfc-card-back', 800, 500, 'card_back.jpg', twoMonthsAgo),
    ],
    createdAt: twoMonthsAgo,
    updatedAt: oneMonthAgo,
  },
  {
    id: generateId('card', 2),
    type: 'card',
    label: 'ICICI Amazon Pay',
    fields: {
      cardNickname: 'Amazon Pay ICICI',
      brand: 'visa',
      lastFourDigits: '8721',
      expiryMonth: '03',
      expiryYear: '2026',
      cardholderName: 'JOHN DOE',
      notes: '5% cashback on Amazon',
    },
    images: [createDummyImage('amazon-card', 800, 500, 'amazon_pay_card.jpg', oneMonthAgo)],
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
  },
  {
    id: generateId('card', 3),
    type: 'card',
    label: 'SBI Debit Card',
    fields: {
      cardNickname: 'SBI Debit - Savings',
      brand: 'rupay',
      lastFourDigits: '9012',
      expiryMonth: '12',
      expiryYear: '2025',
      cardholderName: 'JOHN DOE',
    },
    createdAt: twoMonthsAgo,
    updatedAt: twoMonthsAgo,
  },
  {
    id: generateId('card', 4),
    type: 'card',
    label: 'Amex Platinum',
    fields: {
      cardNickname: 'Amex Platinum Travel',
      brand: 'amex',
      lastFourDigits: '3456',
      expiryMonth: '06',
      expiryYear: '2028',
      cardholderName: 'JOHN DOE',
      notes: 'Travel rewards card - lounge access',
    },
    createdAt: oneMonthAgo,
    updatedAt: now,
  },

  // Government IDs
  {
    id: generateId('govid', 1),
    type: 'govId',
    label: 'Aadhaar Card',
    fields: {
      idType: 'aadhaar',
      idNumber: '1234 5678 9012',
      fullName: 'John Doe',
      dateOfBirth: '15/08/1990',
      issuingAuthority: 'UIDAI',
      notes: 'Linked with mobile: 98765xxxxx',
    },
    images: [
      createDummyImage('aadhaar-front', 800, 500, 'aadhaar_front.jpg', twoMonthsAgo),
      createDummyImage('aadhaar-back', 800, 500, 'aadhaar_back.jpg', twoMonthsAgo),
    ],
    createdAt: twoMonthsAgo,
    updatedAt: twoMonthsAgo,
  },
  {
    id: generateId('govid', 2),
    type: 'govId',
    label: 'PAN Card',
    fields: {
      idType: 'pan',
      idNumber: 'ABCDE1234F',
      fullName: 'John Doe',
      dateOfBirth: '15/08/1990',
      issuingAuthority: 'Income Tax Department',
    },
    images: [createDummyImage('pan-card', 800, 500, 'pan_card.jpg', twoMonthsAgo)],
    createdAt: twoMonthsAgo,
    updatedAt: twoMonthsAgo,
  },
  {
    id: generateId('govid', 3),
    type: 'govId',
    label: 'Passport',
    fields: {
      idType: 'passport',
      idNumber: 'P1234567',
      fullName: 'John Doe',
      dateOfBirth: '15/08/1990',
      issuingAuthority: 'Ministry of External Affairs',
      issueDate: '01/01/2022',
      expiryDate: '31/12/2031',
      notes: 'Valid for all countries',
    },
    images: [
      createDummyImage('passport-main', 600, 800, 'passport_main_page.jpg', oneMonthAgo),
      createDummyImage('passport-last', 600, 800, 'passport_last_page.jpg', oneMonthAgo),
      createDummyImage('passport-visa1', 600, 800, 'us_visa_stamp.jpg', oneMonthAgo),
    ],
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
  },
  {
    id: generateId('govid', 4),
    type: 'govId',
    label: 'Driving License',
    fields: {
      idType: 'drivingLicense',
      idNumber: 'KA0520200012345',
      fullName: 'John Doe',
      dateOfBirth: '15/08/1990',
      issuingAuthority: 'RTO Karnataka',
      issueDate: '15/06/2020',
      expiryDate: '14/06/2040',
      notes: 'LMV + MCWG',
    },
    images: [
      createDummyImage('dl-front', 800, 500, 'driving_license_front.jpg', twoMonthsAgo),
      createDummyImage('dl-back', 800, 500, 'driving_license_back.jpg', twoMonthsAgo),
    ],
    createdAt: twoMonthsAgo,
    updatedAt: twoMonthsAgo,
  },
  {
    id: generateId('govid', 5),
    type: 'govId',
    label: 'Voter ID',
    fields: {
      idType: 'voterId',
      idNumber: 'XYZ1234567',
      fullName: 'John Doe',
      issuingAuthority: 'Election Commission of India',
      notes: 'Registered at HSR Layout',
    },
    images: [createDummyImage('voter-id', 800, 500, 'voter_id.jpg', oneMonthAgo)],
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
  },

  // Logins
  {
    id: generateId('login', 1),
    type: 'login',
    label: 'Gmail Personal',
    fields: {
      serviceName: 'Google / Gmail',
      username: 'johndoe@gmail.com',
      password: 'SuperSecure@123!',
      website: 'https://mail.google.com',
      notes: '2FA enabled with Google Authenticator',
    },
    createdAt: twoMonthsAgo,
    updatedAt: oneMonthAgo,
  },
  {
    id: generateId('login', 2),
    type: 'login',
    label: 'Netflix',
    fields: {
      serviceName: 'Netflix',
      username: 'johndoe@gmail.com',
      password: 'Netflix@2024!',
      website: 'https://netflix.com',
      notes: 'Premium plan - 4 screens',
    },
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
  },
  {
    id: generateId('login', 3),
    type: 'login',
    label: 'Amazon',
    fields: {
      serviceName: 'Amazon India',
      username: 'johndoe@gmail.com',
      password: 'Amazon#Shop2024',
      website: 'https://amazon.in',
      notes: 'Prime member - renewal Jan 2025',
    },
    createdAt: twoMonthsAgo,
    updatedAt: now,
  },
  {
    id: generateId('login', 4),
    type: 'login',
    label: 'GitHub',
    fields: {
      serviceName: 'GitHub',
      username: 'johndoe-dev',
      password: 'GitH@b!Secure2024',
      website: 'https://github.com',
      notes: 'SSH key on MacBook Pro\nPersonal access token stored in 1Password',
    },
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
  },
  {
    id: generateId('login', 5),
    type: 'login',
    label: 'LinkedIn',
    fields: {
      serviceName: 'LinkedIn',
      username: 'johndoe@gmail.com',
      password: 'L1nked!n@Pro',
      website: 'https://linkedin.com',
    },
    createdAt: twoMonthsAgo,
    updatedAt: twoMonthsAgo,
  },
  {
    id: generateId('login', 6),
    type: 'login',
    label: 'Office 365',
    fields: {
      serviceName: 'Microsoft Office 365',
      username: 'john.doe@company.com',
      password: 'Work@Office365!',
      website: 'https://office.com',
      notes: 'Work account - MFA via Microsoft Authenticator',
    },
    createdAt: oneMonthAgo,
    updatedAt: now,
  },

  // Secure Notes
  {
    id: generateId('note', 1),
    type: 'note',
    label: 'WiFi Passwords',
    fields: {
      title: 'Home & Office WiFi',
      content: `Home WiFi:
Network: JohnHome_5G
Password: HomeWifi@2024!

Office WiFi:
Network: TechPark_Guest
Password: GuestAccess123

Backup Router:
Network: JohnHome_Backup
Password: Backup#Wifi2024`,
    },
    createdAt: twoMonthsAgo,
    updatedAt: oneMonthAgo,
  },
  {
    id: generateId('note', 2),
    type: 'note',
    label: 'Emergency Contacts',
    fields: {
      title: 'Important Emergency Numbers',
      content: `Doctor - Dr. Sharma: 98765 43210
Insurance Agent: 87654 32109
Lawyer: 76543 21098
Electrician: 65432 10987
Plumber: 54321 09876

Hospital: Apollo Emergency - 080-2630 4050`,
    },
    createdAt: twoMonthsAgo,
    updatedAt: twoMonthsAgo,
  },
  {
    id: generateId('note', 3),
    type: 'note',
    label: 'Recovery Codes',
    fields: {
      title: 'Google Account Recovery Codes',
      content: `Recovery codes for johndoe@gmail.com:

1. A8K2-M9P3-X7L4
2. B3N5-Q2R8-Y1Z6
3. C6T9-S4V7-W5U2
4. D1F8-K3J6-H9G4
5. E7M2-L5P8-N4Q1

Generated: Oct 2024
Store securely - each code works once`,
    },
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
  },

  // Other Items
  {
    id: generateId('other', 1),
    type: 'other',
    label: 'Gym Membership',
    fields: {
      title: 'Cult Fit Membership',
      field1: 'Member ID: CULT2024-12345',
      field2: 'Valid until: Dec 2025',
      field3: 'Center: Koramangala',
      notes: 'Includes gym + group classes\nRefer code: JOHNFIT100',
    },
    images: [createDummyImage('gym-card', 800, 500, 'membership_card.jpg', oneMonthAgo)],
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
  },
  {
    id: generateId('other', 2),
    type: 'other',
    label: 'Insurance Policy',
    fields: {
      title: 'Health Insurance - HDFC Ergo',
      field1: 'Policy No: HE2024-567890',
      field2: 'Sum Insured: ₹10 Lakhs',
      field3: 'Agent: Rajesh - 98765 12345',
      notes: 'Family floater - Self + Spouse\nRenewal: March every year',
    },
    images: [
      createDummyImage('insurance-policy1', 600, 900, 'policy_page_1.jpg', twoMonthsAgo),
      createDummyImage('insurance-policy2', 600, 900, 'policy_page_2.jpg', twoMonthsAgo),
      createDummyImage('insurance-card', 800, 500, 'health_card.jpg', twoMonthsAgo),
    ],
    createdAt: twoMonthsAgo,
    updatedAt: twoMonthsAgo,
  },
  {
    id: generateId('other', 3),
    type: 'other',
    label: 'Vehicle RC Details',
    fields: {
      title: 'Car Registration',
      field1: 'Number: KA05XX1234',
      field2: 'Make: Hyundai Creta',
      field3: 'Chassis: MALXX12345XX67890',
      notes: 'Insurance: ICICI Lombard\nService center: Nandi Hyundai',
    },
    images: [
      createDummyImage('rc-front', 800, 500, 'rc_book_front.jpg', oneMonthAgo),
      createDummyImage('rc-back', 800, 500, 'rc_book_back.jpg', oneMonthAgo),
      createDummyImage('car-insurance', 600, 900, 'vehicle_insurance.jpg', oneMonthAgo),
      createDummyImage('car-photo', 1200, 800, 'car_photo.jpg', now),
    ],
    createdAt: oneMonthAgo,
    updatedAt: now,
  },
];

/**
 * Get count of items by type for logging
 */
export function getDummyDataSummary(): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const item of DUMMY_VAULT_ITEMS) {
    summary[item.type] = (summary[item.type] || 0) + 1;
  }
  return summary;
}
