'use client';

import Link from 'next/link';
import { CheckCircle, Mail, MessageCircle, BarChart3, Shield, Zap, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    period: '/mo',
    description: 'Perfect for getting started',
    features: [
      '1 keyword tracking',
      'Email notifications only',
      'CPPP portal only',
      '5 results per day',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Basic',
    price: '₹999',
    period: '/mo',
    description: 'For small businesses',
    features: [
      '5 keywords tracking',
      'WhatsApp + Email alerts',
      'GeM + CPPP portals',
      'Unlimited results',
      '72h deadline alerts',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Pro',
    price: '₹2,499',
    period: '/mo',
    description: 'For growing enterprises',
    features: [
      'Unlimited keywords',
      'All government portals',
      'AI eligibility matching',
      'PDF summaries',
      'Priority support',
      'Dashboard analytics',
    ],
    cta: 'Go Pro',
    popular: false,
  },
];

const features = [
  {
    icon: Zap,
    title: 'Daily Auto-Monitoring',
    description: 'We monitor GeM, CPPP, and state portals every morning at 6 AM so you don\'t have to.',
  },
  {
    icon: Shield,
    title: 'AI Eligibility Matching',
    description: 'Our AI reads tender PDFs and tells you if you actually qualify before you waste hours.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Alerts',
    description: 'Get curated tender digests directly on WhatsApp with deadline reminders.',
  },
  {
    icon: Mail,
    title: 'Email Digest',
    description: 'Detailed morning digest with all matching tenders, direct links, and summaries.',
  },
  {
    icon: BarChart3,
    title: 'Pipeline Dashboard',
    description: 'Track applied, watching, and skipped tenders. Export to CSV anytime.',
  },
  {
    icon: CheckCircle,
    title: 'Multi-Portal Coverage',
    description: 'Central Government, State Portals, PSUs - all in one place.',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">GovTender Scout</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-primary transition">Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-primary transition">Pricing</Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-primary transition">How It Works</Link>
              <Link href="/signup" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition">
                Get Started Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4">
            <div className="flex flex-col space-y-4 px-4">
              <Link href="#features" className="text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
              <Link href="/signup" className="bg-primary text-white px-6 py-2 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-teal-700 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Never Miss a Government Tender Again
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-teal-100">
              AI-powered tender matching that tells you which bids you actually qualify for. 
              Get daily WhatsApp & email alerts. Save 20+ hours per week.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight size={20} />
              </Link>
              <Link
                href="#how-it-works"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary transition"
              >
                See How It Works
              </Link>
            </div>
            <p className="mt-6 text-teal-200 text-sm">
              No credit card required • Free plan available • Setup in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Win More Tenders
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stop manually checking portals. Let our AI do the heavy lifting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How GovTender Scout Works
            </h2>
            <p className="text-xl text-gray-600">From monitoring to your inbox in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', time: '6:00 AM', title: 'We Monitor', desc: 'Our system checks GeM, CPPP, and 15+ state portals' },
              { step: '2', time: '6:30 AM', title: 'AI Analysis', desc: 'Claude AI reads PDFs and extracts eligibility criteria' },
              { step: '3', time: '7:00 AM', title: 'Smart Matching', desc: 'Your profile is matched against new tenders' },
              { step: '4', time: '8:00 AM', title: 'You Get Alerts', desc: 'WhatsApp + email digest with qualified tenders' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <p className="text-sm text-primary font-semibold mb-2">{item.time}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">Start free, upgrade when you're ready</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 ${
                  plan.popular ? 'ring-2 ring-primary shadow-xl scale-105' : 'shadow-sm'
                }`}
              >
                {plan.popular && (
                  <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mt-4">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block w-full py-3 px-6 rounded-lg text-center font-semibold transition ${
                    plan.popular
                      ? 'bg-primary text-white hover:bg-opacity-90'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Save 20+ Hours Per Week?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Join 500+ Indian businesses using GovTender Scout to find and win government contracts.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
          >
            Start Your Free Trial Today
          </Link>
          <p className="mt-4 text-teal-200 text-sm">
            Free plan includes 1 keyword • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold text-white">GovTender Scout</span>
              <p className="mt-4 text-sm text-gray-400">
                AI-powered government tender matching for Indian businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            © 2024 GovTender Scout. All rights reserved. Made with ❤️ in India.
          </div>
        </div>
      </footer>
    </div>
  );
}
