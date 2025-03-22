import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem("userId");

  const { cartItemIds } = location.state || { cartItemIds: [] };
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Card payment state
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 16) {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      const formatted = value.replace(/(\d{2})(\d{1,2})/, "$1/$2");
      setCardExpiry(formatted);
    }
  };

  const handleCVVChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 3) {
      setCardCVV(value);
    }
  };

  const handleSubmitPayment = async () => {
    try {
      let paymentData;

      if (paymentMethod === "card") {
        if (cardNumber.length !== 16) {
          setError("Card number must be 16 digits");
          return;
        }

        if (!cardExpiry || cardExpiry.length < 5) {
          setError("Please enter a valid expiry date (MM/YY)");
          return;
        }

        if (!cardName) {
          setError("Please enter the name on card");
          return;
        }

        if (cardCVV.length !== 3) {
          setError("CVV must be 3 digits");
          return;
        }

        paymentData = {
          method: "card",
          cardDetails: {
            name: cardName,
            number: cardNumber,
            expiry: cardExpiry,
            cvv: cardCVV,
          },
        };
      } else {
        paymentData = {
          method: "cash_on_delivery",
        };
      }

      await axios.post(
        "http://localhost:3000/api/payments/process",
        paymentData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      await axios.put(
        `http://localhost:3000/api/cart/cart/complete-order/${userId}`,
        {
          cartItemIds,
          IsOrderProcessed: false,
        }
      );

      alert("Payment processed successfully!");
      navigate(`/userproducts`);
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.response?.data?.error || "Payment processing failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400">
      <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-2xl">
        <h2 className="text-4xl font-semibold text-center text-gray-800 mb-8">
          Payment
        </h2>

        <div className="mb-6">
          <p className="text-lg font-medium text-gray-700 mb-3">
            Select Payment Method
          </p>
          <div className="flex space-x-4">
            <div
              className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === "card"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-300"
              }`}
              onClick={() => setPaymentMethod("card")}
            >
              <span className="font-medium">Card</span>
            </div>

            <div
              className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === "cash_on_delivery"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-300"
              }`}
              onClick={() => setPaymentMethod("cash_on_delivery")}
            >
              <span className="font-medium">Cash on Delivery</span>
            </div>
          </div>
        </div>

        {paymentMethod === "card" && (
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Name on Card
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}
                onChange={handleCardNumberChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  value={cardCVV}
                  onChange={handleCVVChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSubmitPayment}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-6"
        >
          Complete Payment
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
