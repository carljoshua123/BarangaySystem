export const formatRequestDocument = (request) => {
  const details = request.details || {};
  const dateIssued = request.createdAt ? new Date(request.createdAt) : null;
  const issueDate = dateIssued
    ? dateIssued.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '[Date of issue]';
  const day = dateIssued?.getDate();
  const daySuffix = day % 100 >= 11 && day % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th');
  const formalIssueDate = dateIssued
    ? `${day}${daySuffix} day of ${dateIssued.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}`
    : '[Day] day of [Month, Year]';
  const address = `${request.address}, Barangay 125, Tondo, Manila`;
  const chairman = 'Boyet Bernardo';
  const treasurer = 'Carl Joshua Bernardo';
  const civilStatus = details.civilStatus?.toLowerCase() || '[Civil Status]';
  const nationality = details.nationality
    ? `${details.nationality.charAt(0).toUpperCase()}${details.nationality.slice(1).toLowerCase()}`
    : '[Nationality]';

  switch (request.requestType) {
    case 'Barangay Certificate of Residency':
      return [
        'REPUBLIC OF THE PHILIPPINES', 'CITY OF MANILA', 'BARANGAY 125', 'OFFICE OF THE PUNONG BARANGAY', '',
        'CERTIFICATE OF RESIDENCY', '', 'TO WHOM IT MAY CONCERN:', '',
        `This is to certify that ${request.fullName}, ${details.legalAgeConfirmed ? 'of legal age' : '[Legal age status]'}, ${civilStatus}, and ${nationality}, is a permanent resident of ${address}.`, '',
        'Furthermore, the above-named person is of good moral character and has no derogatory record on file in this barangay.', '',
        `Issued this ${formalIssueDate} at Barangay 125, City of Manila, upon the request of the interested party for ${request.purpose || '[Purpose]'}.`, '', '',
        '[[CHAIRMAN_SIGNATURE]]', chairman, 'Punong Barangay'
      ].join('\n');
    case 'Certificate of Indigency':
      return [
        'REPUBLIC OF THE PHILIPPINES', 'CITY OF MANILA', 'BARANGAY 125', 'OFFICE OF THE BARANGAY CHAIRMAN', '',
        'CERTIFICATE OF INDIGENCY', '', 'TO WHOM IT MAY CONCERN:', '',
        `This is to certify that ${request.fullName}, ${details.age || '[Age]'} years old, ${details.civilStatus || '[Civil Status]'}, is a bona fide resident of ${address}.`,
        'This is to certify further that the resident belongs to an indigent family whose monthly income falls below the poverty threshold and is struggling to meet basic daily needs.',
        'This certification is issued upon the request of the bearer for whatever legal, medical, or financial assistance purpose it may serve.',
        `Given this ${issueDate} at Barangay 125, City of Manila.`, '', '[[CHAIRMAN_SIGNATURE]]', chairman, 'Punong Barangay'
      ].join('\n');
    case 'Barangay Business Clearance (or Permit)':
      return [
        'REPUBLIC OF THE PHILIPPINES', 'CITY OF MANILA', 'BARANGAY 125', 'OFFICE OF THE PUNONG BARANGAY', '',
        'BARANGAY BUSINESS CLEARANCE', '', 'TO WHOM IT MAY CONCERN:', '',
        'Pursuant to the provisions of the Local Government Code and local ordinances of Barangay 125, clearance is hereby granted to:',
        `Business Name: ${details.businessName || '[Business Name / Trade Name]'}`,
        `Owner/Proprietor: ${details.ownerName || request.fullName}`,
        `Business Address: ${details.businessAddress || '[Business Address]'}`,
        `Type of Business: ${details.businessType || '[Type of Business]'}`,
        'To operate within Barangay 125, City of Manila, subject to compliance with existing barangay, city, and national laws.',
        `Issued this ${issueDate}. Valid until [Expiry Date to be completed by barangay office].`, '',
        '[[TREASURER_SIGNATURE]]', treasurer, 'Barangay Treasurer', '', '[[CHAIRMAN_SIGNATURE]]', chairman, 'Punong Barangay'
      ].join('\n');
    case 'First-Time Jobseeker Barangay Certificate':
      return [
        'REPUBLIC OF THE PHILIPPINES', 'CITY OF MANILA', 'BARANGAY 125', '',
        'OATH OF UNDERTAKING AND BARANGAY CERTIFICATION FOR FIRST-TIME JOBSEEKER', '',
        `This is to certify that ${request.fullName}, ${details.age || '[Age]'} years old, is a resident of ${address}, and qualifies as a First-Time Jobseeker pursuant to Republic Act No. 11261.`,
        '', "APPLICANT'S DECLARATION:",
        'I declare that I am actively seeking employment for the first time, have not availed of these benefits before, and understand my rights and obligations under the law.',
        `Issued this ${issueDate} to enable the applicant to avail of fee exemptions for government credentials needed for employment.`, '',
        '______________________________', request.fullName, 'Signature of Applicant', '', '[[CHAIRMAN_SIGNATURE]]', chairman, 'Punong Barangay'
      ].join('\n');
    case 'Certificate of Good Moral Character':
      return [
        'REPUBLIC OF THE PHILIPPINES', 'CITY OF MANILA', 'BARANGAY 125', '',
        'CERTIFICATE OF GOOD MORAL CHARACTER', '', 'TO WHOM IT MAY CONCERN:', '',
        `This is to certify that ${request.fullName}, of legal age, ${details.civilStatus || '[Civil Status]'}, is a permanent resident of ${address}.`,
        'During residency in this barangay, the subject person has maintained good moral character, is law-abiding, and has no pending complaint recorded in the Barangay Blotter or Lupon Tagapamayapa.',
        `This certification is issued upon the request of the bearer for ${request.purpose || '[Purpose]'}.`,
        `Given this ${issueDate} at Barangay 125, City of Manila.`, '', '[[CHAIRMAN_SIGNATURE]]', chairman, 'Punong Barangay'
      ].join('\n');
    case 'Blotter Reports / Incident Records':
      return [
        'REPUBLIC OF THE PHILIPPINES', 'CITY OF MANILA', 'BARANGAY 125', 'OFFICE OF THE LUPON TAGAPAMAYAPA / BLOTTER DESK', '',
        'INCIDENT / BLOTTER REPORT', '', 'Entry Number: BRG125-[YEAR]-[MONTH]-[Assigned by blotter desk]',
        `Date Reported: ${issueDate} | Time: [Time received by desk]`,
        `Place of Incident: ${details.incidentLocation || '[Location inside Barangay 125]'}`, '',
        'COMPLAINANT:', `Name: ${request.fullName} | Contact: ${request.contact}`, `Address: ${address}`, '',
        'RESPONDENT:', `Name: ${details.respondentName || '[Respondent Name]'}`, `Address: ${details.respondentAddress || '[Respondent Address]'}`, '',
        `NATURE OF INCIDENT: ${details.incidentNature || '[Nature of Incident]'}`,
        `Incident date/time: ${details.incidentDate || '[Date]'} ${details.incidentTime || '[Time]'}`,
        'NARRATIVE REPORT:', details.narrative || '[Narrative]', '',
        'Recorded by: [Name of Barangay Duty Desk Officer]', 'Barangay Blotter Officer', '',
        '[[CHAIRMAN_SIGNATURE]]', `Noted by: ${chairman}`, 'Punong Barangay'
      ].join('\n');
    default:
      return 'Barangay 125 request document';
  }
};

const documentTitles = {
  'Barangay Certificate of Residency': 'CERTIFICATE OF RESIDENCY',
  'Certificate of Indigency': 'CERTIFICATE OF INDIGENCY',
  'Barangay Business Clearance (or Permit)': 'BARANGAY BUSINESS CLEARANCE',
  'First-Time Jobseeker Barangay Certificate': 'OATH OF UNDERTAKING AND BARANGAY CERTIFICATION FOR FIRST-TIME JOBSEEKER',
  'Certificate of Good Moral Character': 'CERTIFICATE OF GOOD MORAL CHARACTER',
  'Blotter Reports / Incident Records': 'INCIDENT / BLOTTER REPORT'
};

const documentOffices = {
  'Barangay Certificate of Residency': 'OFFICE OF THE PUNONG BARANGAY',
  'Certificate of Indigency': 'OFFICE OF THE BARANGAY CHAIRMAN',
  'Barangay Business Clearance (or Permit)': 'OFFICE OF THE PUNONG BARANGAY',
  'First-Time Jobseeker Barangay Certificate': 'OFFICE OF THE PUNONG BARANGAY',
  'Certificate of Good Moral Character': 'OFFICE OF THE PUNONG BARANGAY',
  'Blotter Reports / Incident Records': 'OFFICE OF THE LUPON TAGAPAMAYAPA / BLOTTER DESK'
};

export const getRequestDocumentOffice = (request) => documentOffices[request.requestType] || 'BARANGAY 125';

export const getRequestDocumentParts = (request) => {
  const lines = formatRequestDocument(request).split('\n');
  const title = documentTitles[request.requestType] || 'BARANGAY 125 DOCUMENT';
  const titleIndex = lines.indexOf(title);

  return {
    title,
    body: titleIndex === -1 ? lines.join('\n') : lines.slice(titleIndex + 1).join('\n').trimStart()
  };
};