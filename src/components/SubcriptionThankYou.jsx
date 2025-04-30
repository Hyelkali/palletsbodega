import "./EmailTemplates.css"

const SubscriptionThankYou = ({ email = "subscriber@example.com" }) => {
  return (
    <div className="email-template">
      <div className="email-container">
        <div className="email-header">
          <img src="/logo.png" alt="PalletBodega Logo" className="email-logo" />
        </div>

        <div className="email-body">
          <h1>Thanks for Subscribing!</h1>
          <p>Hello there,</p>
          <p>
            Thank you for subscribing to PalletBodega's newsletter. You've been added to our mailing list with the email
            address: <strong>{email}</strong>
          </p>

          <div className="subscription-benefits">
            <h2>What to expect:</h2>
            <ul>
              <li>Weekly deals and promotions</li>
              <li>New product announcements</li>
              <li>Exclusive subscriber-only offers</li>
              <li>Seasonal sales notifications</li>
            </ul>
          </div>

          <div className="email-cta">
            <a href="/todays-deals" className="email-button">
              Check Out Today's Deals
            </a>
          </div>

          <p>We're excited to have you join our community!</p>
          <p>The PalletBodega Team</p>
        </div>

        <div className="email-footer">
          <p>&copy; {new Date().getFullYear()} PalletBodega. All rights reserved.</p>
          <div className="email-social">
            <a href="#" className="social-link">
              Facebook
            </a>
            <a href="#" className="social-link">
              Instagram
            </a>
            <a href="#" className="social-link">
              Twitter
            </a>
          </div>
          <p className="email-unsubscribe">
            You're receiving this email because you signed up for PalletBodega newsletters.
            <br />
            <a href="#">Unsubscribe</a> or <a href="#">manage your email preferences</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionThankYou
