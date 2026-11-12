import React from 'react';

export default function HomePage() {
  const features = [
    {
      title: 'Barangay Reports',
      text: 'Submit community concerns quickly and stay connected with local updates.'
    },
    {
      title: 'Resident Support',
      text: 'Access support services and keep track of incidents in your area.'
    },
    {
      title: 'Transparent Updates',
      text: 'View important barangay activity and resolution progress centrally.'
    }
  ];

  const requestTypes = [
    {
      title: 'Barangay Certificate of Residency',
      description: 'Certifies that an individual is a bona fide resident of the barangay. Often requested if a company, school, or institution specifically needs proof of address rather than a full clearance.'
    },
    {
      title: 'Certificate of Indigency',
      description: 'Proves that a resident belongs to a low-income or underprivileged family. This is heavily used to access financial assistance, medical aid, hospital discounts, or free legal services from government agencies (like PCSO, DSWD, or local government units).'
    },
    {
      title: 'Barangay Business Clearance (or Permit)',
      description: 'Required for entrepreneurs and business owners operating within the barangay. It is a mandatory prerequisite before you can secure a Mayor\'s Permit or Business License from the city or municipal hall.'
    },
    {
      title: 'First-Time Jobseeker Barangay Certificate',
      description: 'Under Republic Act No. 11261 (First-Time Jobseekers Assistance Act), qualified fresh graduates and first-time jobseekers can get a clearance and other supporting documents free of charge.'
    },
    {
      title: 'Certificate of Good Moral Character',
      description: 'Often requested by schools, universities, or employers to attest that the resident has a clean record and no bad standing in the community.'
    },
    {
      title: 'Blotter Reports / Incident Records',
      description: 'Requested by residents who need official documentation of a dispute, altercation, neighborhood noise complaint, or accident for legal or insurance purposes.'
    }
  ];

  return (
    <div className="public-page home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Connected community</p>
          <h1>Empowering Barangay Service Through Digital Access</h1>
          <p className="hero-text">
            BarangayConnect Portal helps residents report concerns, track barangay updates,
            and access essential local services faster and more transparently.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-btn">Get Started</button>
            <button type="button" className="secondary-btn">Learn More</button>
          </div>
        </div>

        <div className="hero-card">
          <div className="mini-stat">
            <span className="mini-label">Active Reports</span>
            <strong>1,284</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Resolved</span>
            <strong>93%</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Residents Served</span>
            <strong>8.4K</strong>
          </div>
        </div>
      </section>

      <section className="request-panel">
        <div className="request-header">
          <p className="eyebrow">Resident services</p>
          <h2>Common Types of Requests &amp; Clearances</h2>
        </div>

        <div className="request-list">
          {requestTypes.map((item) => (
            <article key={item.title} className="request-item">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <div className="feature-icon">✦</div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
