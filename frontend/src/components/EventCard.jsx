import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { Link } from 'react-router-dom';

function PaymentApproval() {
  const { enqueueSnackbar } = useSnackbar();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          enqueueSnackbar('Please log in to view pending payments', { variant: 'error' });
          return;
        }

        const response = await axios.get('http://localhost:5001/api/payments/pending', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setPendingPayments(response.data.payments.map(payment => ({
            id: payment._id,
            amount: payment.amount,
            cardHolder: payment.cardDetails.cardHolder,
            timestamp: payment.timestamp,
            event: {
              id: payment.event._id,
              name: payment.event.title
            },
            user: {
              id: payment.user._id,
              name: payment.user.username,
              email: payment.user.email
            }
          })));
        } else {
          enqueueSnackbar('Failed to load pending payments', { variant: 'error' });
        }
      } catch (error) {
        console.error('Error fetching pending payments:', error);
        enqueueSnackbar('Failed to load pending payments', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPayments();
  }, [enqueueSnackbar]);

  const handleApprove = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        enqueueSnackbar('Please log in to approve payments', { variant: 'error' });
        return;
      }

      const response = await axios.put(
        `http://localhost:5001/api/payments/approve/${paymentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setPendingPayments(prevPayments => 
          prevPayments.filter(payment => payment.id !== paymentId)
        );
        
        enqueueSnackbar('Payment approved successfully! User registered for event.', { 
          variant: 'success' 
        });
      } else {
        enqueueSnackbar(response.data.message || 'Failed to approve payment', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to approve payment', { variant: 'error' });
    }
  };

  const handleReject = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        enqueueSnackbar('Please log in to reject payments', { variant: 'error' });
        return;
      }

      const response = await axios.put(
        `http://localhost:5001/api/payments/reject/${paymentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setPendingPayments(prevPayments => 
          prevPayments.filter(payment => payment.id !== paymentId)
        );
        
        enqueueSnackbar('Payment rejected successfully.', { 
          variant: 'warning' 
        });
      } else {
        enqueueSnackbar(response.data.message || 'Failed to reject payment', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to reject payment', { variant: 'error' });
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Pending Payment Approvals</h2>
      
      {pendingPayments.length === 0 ? (
        <p>No pending payments to approve.</p>
      ) : (
        <div>
          <p>The following payments are awaiting your approval:</p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Payment ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Event</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map(payment => (
                  <tr key={payment.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{payment.id}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                      {payment.user.name}<br/>
                      <span style={{ fontSize: '0.8em', color: '#666' }}>{payment.user.email}</span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{payment.event.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>LKR {payment.amount.toFixed(2)}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                      {new Date(payment.timestamp).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                      <button 
                        onClick={() => handleApprove(payment.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '10px'
                        }}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(payment.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentApproval;