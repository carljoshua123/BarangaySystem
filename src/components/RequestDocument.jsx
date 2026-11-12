import React from 'react';
import sealImage from '../assets/seal.png';
import { getRequestDocumentOffice, getRequestDocumentParts } from '../requestDocument';

export default function RequestDocument({ request }) {
  const { title, body } = getRequestDocumentParts(request);
  const bodyParts = body.split(/(\[\[(?:TREASURER|CHAIRMAN)_SIGNATURE\]\])/g);

  return (
    <div className="official-document-preview">
      <header className="official-document-letterhead">
        <img src={sealImage} alt="Barangay 125 seal" />
        <div>
          <p>REPUBLIC OF THE PHILIPPINES</p>
          <p>CITY OF MANILA</p>
          <p>BARANGAY 125</p>
          <p>{getRequestDocumentOffice(request)}</p>
        </div>
      </header>
      <h3 className="official-document-title">{title}</h3>
      {bodyParts.map((part, index) => {
        if (part === '[[CHAIRMAN_SIGNATURE]]' || part === '[[TREASURER_SIGNATURE]]') {
          const isTreasurer = part === '[[TREASURER_SIGNATURE]]';
          const signatureData = isTreasurer ? request.treasurerSignatureData : request.signatureData;
          const signer = isTreasurer ? 'Treasurer' : 'Chairman';
          return (
            <div key={`${signer}-${index}`} className="official-document-signature">
              {signatureData
                ? <img src={signatureData} alt={`${signer}'s digital signature`} />
                : <span className="official-document-signature-line" />}
            </div>
          );
        }

        return part ? <pre key={`body-${index}`} className="request-document-preview">{part}</pre> : null;
      })}
    </div>
  );
}