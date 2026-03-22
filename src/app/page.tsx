'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trophy, Heart, Users, ChevronRight, Play } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">GolfImpact</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/charities" className="text-sm font-semibold hover:text-green-600 transition-colors">Charities</Link>
          <Link href="/pricing" className="text-sm font-semibold hover:text-green-600 transition-colors">Pricing</Link>
          <Link href="/login" className="text-sm font-semibold hover:text-green-600 transition-colors">Login</Link>
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8">
            <Link href="/signup">Join Now</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1 px-4 rounded-full bg-green-50 text-green-700 text-sm font-bold mb-6 border border-green-100 uppercase tracking-widest">
              Play for a cause
            </span>
            <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tighter">
              Turn Your <span className="text-green-600 italic">Scores</span> Into <span className="text-blue-600">Impact</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-lg leading-relaxed">
              The only platform where your golf handicap helps you win big while supporting the charities you love. Join thousands of golfers making a difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-10 h-14 text-lg">
                <Link href="/signup" className="flex items-center gap-2">
                  Get Started <ChevronRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-gray-200 text-gray-900 hover:bg-gray-50 rounded-full px-10 h-14 text-lg">
                <Play className="w-5 h-5 mr-2" /> How it Works
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white">
              <img
                src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop"
                alt="Golfing for impact"
                className="w-full h-[500px] object-cover"
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-60 animate-pulse"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">How GolfImpact Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              We've simplified charity giving through the game of golf. No complex rules, just pure impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'Join the Community',
                desc: 'Sign up and choose a charity that you want to support. A portion of your fee goes directly to them.',
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-100'
              },
              {
                title: 'Play & Record',
                desc: 'Enter your Stableford scores after each round. We keep track of your latest 5 scores for the monthly draw.',
                icon: Trophy,
                color: 'text-green-600',
                bg: 'bg-green-100'
              },
              {
                title: 'Win & Donate',
                desc: 'If your scores match the drawn numbers, you win! Plus, your charity gets an extra boost.',
                icon: Heart,
                color: 'text-red-600',
                bg: 'bg-red-100'
              }
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group"
              >
                <div className={`w-16 h-16 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-lg">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto bg-green-600 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden text-center"
        >
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Ready to Make an Impact on the Fairway?</h2>
            <p className="text-xl text-green-50 mb-12 leading-relaxed">
              Join our growing community of golfers who believe in playing for more than just a lower handicap.
            </p>
            <Button asChild size="lg" className="bg-white text-green-600 hover:bg-green-50 rounded-full px-12 h-16 text-xl font-bold">
              <Link href="/signup">Sign Up Today</Link>
            </Button>
          </div>

          {/* Abstract circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">GolfImpact</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 Golf Charity Subscription Platform. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm font-semibold text-gray-400">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
