import React from 'react';

export default function ContactPage() {
  const contacts = [
    { label: 'Phone', value: '+63 912 345 6789' },
    { label: 'Email', value: 'support@barangayconnect.ph' },
    { label: 'Office', value: 'Barangay Hall, Local Government Center' }
  ];

  return (
    <div className="public-page contact-page">
      <section className="page-header">
        <p className="eyebrow">Contact</p>
        <h1>We’re here to help.</h1>
      </section>

      <div className="contact-grid">
        <div className="contact-card">
          {contacts.map((item) => (
            <div key={item.label} className="contact-row">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <form className="contact-form">
          <label>
            Full Name
            <input type="text" placeholder="Your name" />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Message
            <textarea rows="5" placeholder="Write your message here..." />
          </label>
          <button type="submit" className="primary-btn">Send Message</button>
        </form>
      </div>
    </div>
  );
}
