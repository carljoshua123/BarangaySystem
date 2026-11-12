export const requestTypes = [
  {
    title: 'Barangay Certificate of Residency',
    description: 'Certifies that an individual is a bona fide resident of the barangay.',
    purposeRequired: true,
    fields: [
      { name: 'legalAgeConfirmed', label: 'I confirm that I am of legal age.', type: 'checkbox' },
      { name: 'civilStatus', label: 'Civil Status', type: 'select', options: ['Single', 'Married', 'Widowed', 'Separated'] },
      { name: 'nationality', label: 'Nationality', placeholder: 'e.g., Filipino' }
    ]
  },
  {
    title: 'Certificate of Indigency',
    description: 'Used to prove financial need for assistance and support from government programs.',
    purposeRequired: true,
    fields: [
      { name: 'age', label: 'Age', type: 'number', min: 1 },
      { name: 'civilStatus', label: 'Civil Status', type: 'select', options: ['Single', 'Married', 'Widowed', 'Separated'] }
    ]
  },
  {
    title: 'Barangay Business Clearance (or Permit)',
    description: 'Required for entrepreneurs and business owners before securing permits.',
    fields: [
      { name: 'businessName', label: 'Business Name / Trade Name' },
      { name: 'ownerName', label: 'Owner / Proprietor Name' },
      { name: 'businessAddress', label: 'Business Address' },
      { name: 'businessType', label: 'Type of Business', placeholder: 'e.g., Sari-sari store' }
    ]
  },
  {
    title: 'First-Time Jobseeker Barangay Certificate',
    description: 'Under Republic Act No. 11261 (First-Time Jobseekers Assistance Act).',
    fields: [
      { name: 'age', label: 'Age', type: 'number', min: 1 },
      { name: 'jobseekerDeclaration', label: 'I am seeking employment for the first time and have not availed of these benefits before.', type: 'checkbox' }
    ]
  },
  {
    title: 'Certificate of Good Moral Character',
    description: 'A record of good standing commonly requested by schools and employers.',
    purposeRequired: true,
    fields: [
      { name: 'civilStatus', label: 'Civil Status', type: 'select', options: ['Single', 'Married', 'Widowed', 'Separated'] }
    ]
  },
  {
    title: 'Blotter Reports / Incident Records',
    description: 'Official documentation for disputes, complaints, or incidents in the community.',
    fields: [
      { name: 'incidentDate', label: 'Date of Incident', type: 'date' },
      { name: 'incidentTime', label: 'Time of Incident', type: 'time' },
      { name: 'incidentLocation', label: 'Place of Incident' },
      { name: 'respondentName', label: 'Respondent Name' },
      { name: 'respondentAddress', label: 'Respondent Address' },
      { name: 'incidentNature', label: 'Nature of Incident' },
      { name: 'narrative', label: 'Narrative Report', type: 'textarea' }
    ]
  }
];