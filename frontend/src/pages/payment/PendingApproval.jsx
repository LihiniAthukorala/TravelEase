import React from 'react';
import { useLocation, Link } from 'react-router-dom';

function PendingApproval() {
  const location = useLocation();
  const paymentId = location.state?.paymentId || 'Unknown';

  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 0 15px rgba(0,0,0,0.1)',
      backgroundColor: '#fff',
      textAlign: 'center'
    }}>
      <div style={{
        width: '70px',
        height: '70px',
        margin: '0 auto 20px',
        borderRadius: '50%',
        backgroundColor: '#ffc107',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: '40px', color: 'white' }}>⌛</span>
      </div>
      
      <h2 style={{ color: '#333', marginBottom: '15px' }}>Payment Pending Approval</h2>
      
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
        Your payment (ID: {paymentId}) has been submitted and is awaiting admin approval.
      </p>
      
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
        Once your payment is approved, you will be registered for the event.
        You will receive a confirmation email when this process is complete.
      </p>
      
      <div style={{ marginTop: '30px' }}>
        <Link to="/events" style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '4px',
          marginRight: '15px'
        }}>
          Browse Events
        </Link>
        
        <Link to="/" style={{
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default PendingApproval;
