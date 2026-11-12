import React from 'react';

export default function AboutPage() {
  const values = [
    'Inclusive community support',
    'Prompt public service response',
    'Transparency and accountability',
    'Accessible digital services for all'
  ];

  return (
    <div className="public-page about-page">
      <section className="page-header">
        <p className="eyebrow">About us</p>
        <h1>Building a safer and more connected barangay.</h1>
      </section>

      <div className="about-content">
        <div className="about-copy">
          <p>
            BarangayConnect Portal was created to bridge the gap between residents and local
            government services. We aim to make reporting, communication, and citizen engagement
            seamless through an easy-to-use digital platform.
          </p>
          <p>
            Our mission is to support public service delivery with transparency, accountability,
            and a stronger sense of community across every barangay.
          </p>
        </div>

        <div className="about-panel">
          <h3>Our values</h3>
          <ul>
            {values.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
