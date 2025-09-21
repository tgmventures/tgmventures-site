'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showProjects, setShowProjects] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email?.endsWith('@tgmventures.com')) {
        // Get user data from localStorage for quick access
        const userData = localStorage.getItem('tgm_user')
        if (userData) {
          setUser(JSON.parse(userData))
        } else {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          })
        }
      } else {
        // Not authenticated or wrong domain
        router.push('/login')
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('tgm_user')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="https://github.com/tgmventures/tgmventures-site/blob/main/images/tgm-logo-icon.png?raw=true"
                alt="TGM Logo"
                width={40}
                height={40}
                className="mr-3"
              />
              <h1 className="text-xl font-semibold text-gray-900">TGM Ventures Dashboard</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Core Apps */}
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-6">Core Applications</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Gmail */}
              <a
                href="https://gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-gray-300">
                  <div className="p-8 h-full flex flex-col items-center justify-center">
                    <div className="text-5xl mb-3">📧</div>
                    <span className="text-sm font-medium text-gray-700">Gmail</span>
                  </div>
                </div>
              </a>

              {/* Google Drive */}
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-gray-300">
                  <div className="p-8 h-full flex flex-col items-center justify-center">
                    <div className="text-5xl mb-3">📁</div>
                    <span className="text-sm font-medium text-gray-700">Google Drive</span>
                  </div>
                </div>
              </a>

              {/* Rent Manager */}
              <a
                href="https://tgm.rmx.rentmanager.com/#/welcome/myworkspace"
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-gray-300">
                  <div className="p-8 h-full flex flex-col items-center justify-center">
                    <div className="text-5xl mb-3">🏠</div>
                    <span className="text-sm font-medium text-gray-700">Rent Manager</span>
                  </div>
                </div>
              </a>

              {/* Asana */}
              <a
                href="https://app.asana.com/1/1200134672573905/home"
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-gray-300">
                  <div className="p-8 h-full flex flex-col items-center justify-center">
                    <div className="text-5xl mb-3">✅</div>
                    <span className="text-sm font-medium text-gray-700">Asana</span>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* TGM Projects Section */}
          <div>
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-6 hover:text-gray-900 transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform ${showProjects ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              TGM Projects
            </button>

            {showProjects && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Work in Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* RefiHub */}
                  <a
                    href="/refihub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                      <div className="text-3xl mb-2">🏡</div>
                      <h4 className="font-medium text-gray-800">RefiHub</h4>
                      <p className="text-xs text-gray-500 mt-1">Real Estate Platform</p>
                    </div>
                  </a>

                  {/* LivePFS */}
                  <a
                    href="https://livepfs.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                      <div className="text-3xl mb-2">📊</div>
                      <h4 className="font-medium text-gray-800">LivePFS</h4>
                      <p className="text-xs text-gray-500 mt-1">Financial Tracking</p>
                    </div>
                  </a>

                  {/* Legacy Games */}
                  <a
                    href="/legacy-games/stock-game.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                      <div className="text-3xl mb-2">🎮</div>
                      <h4 className="font-medium text-gray-800">Stock Game</h4>
                      <p className="text-xs text-gray-500 mt-1">Educational Game</p>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
