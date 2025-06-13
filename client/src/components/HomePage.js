import React from 'react';
import { motion } from 'framer-motion';
import './HomePage.css';

const HomePage = () => {
  const services = [
    {
      title: 'Mouse Repair',
      icon: '🖱️',
      description: 'Fix clicking issues, sensor problems, and more'
    },
    {
      title: 'Keyboard Repair',
      icon: '⌨️',
      description: 'Fix sticky keys, LED issues, and connectivity problems'
    },
    {
      title: 'Headphone Repair',
      icon: '🎧',
      description: 'Fix audio issues, broken cables, and connection problems'
    },
    {
      title: 'Controller Repair',
      icon: '🎮',
      description: 'Fix drift issues, button problems, and connectivity'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Submit Request',
      description: 'Fill out our simple form with your device details'
    },
    {
      number: '02',
      title: 'Get Quote',
      description: 'Receive a detailed quote for your repair'
    },
    {
      number: '03',
      title: 'Repair',
      description: 'Our experts fix your device with care'
    },
    {
      number: '04',
      title: 'Return',
      description: 'Get your device back, good as new'
    }
  ];

  const testimonials = [
    {
      name: 'Alex K.',
      role: 'Professional Gamer',
      text: 'They fixed my gaming mouse in record time. The service was amazing!',
      rating: 5
    },
    {
      name: 'Sarah M.',
      role: 'Streamer',
      text: 'My keyboard is working perfectly after their repair. Highly recommended!',
      rating: 5
    },
    {
      name: 'Mike R.',
      role: 'Gaming Enthusiast',
      text: 'Great service, fair prices, and quick turnaround. Will use again!',
      rating: 5
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Expert Gaming Gear Repair
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Professional repair services for your gaming peripherals. Fast, reliable, and affordable.
          </motion.p>
          <motion.button
            className="cta-button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Request Repair Now
          </motion.button>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <h2>Our Services</h2>
        <div className="services-grid">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="service-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <span className="service-icon">{service.icon}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <h2>What Our Customers Say</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="stars">
                {'★'.repeat(testimonial.rating)}
                {'☆'.repeat(5 - testimonial.rating)}
              </div>
              <p className="testimonial-text">{testimonial.text}</p>
              <div className="testimonial-author">
                <h4>{testimonial.name}</h4>
                <p>{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Ready to Fix Your Gaming Gear?</h2>
          <p>Get started with our simple repair request process</p>
          <motion.button
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Request Repair Now
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage; 