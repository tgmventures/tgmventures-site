'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  arrayUnion
} from 'firebase/firestore'

interface TrainingModule {
  id: string
  title: string
  description: string
  loomUrl: string
  category: string
  checklist: string[]
  comments: Comment[]
  createdBy: string
  createdByEmail: string
  createdAt: any
}

interface Comment {
  id: string
  text: string
  asanaTaskUrl?: string
  createdBy: string
  createdByEmail: string
  createdAt: any
}

export default function TrainingPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    loomUrl: '',
    category: ''
  })
  const [checklistItem, setChecklistItem] = useState('')
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [commentText, setCommentText] = useState('')
  const [asanaTaskUrl, setAsanaTaskUrl] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [filteredCategories, setFilteredCategories] = useState<string[]>([])

  const isAdmin = user?.email === 'antonio@tgmventures.com' // Admin check

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadModules()
      loadCategories()
    }
  }, [user])

  const loadModules = async () => {
    try {
      const q = query(collection(db, 'trainingModules'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const modulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TrainingModule))
      setModules(modulesData)
    } catch (error) {
      console.error('Error loading modules:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'trainingCategories'))
      const categoriesData = snapshot.docs.map(doc => doc.data().name)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      // Add category if it's new
      if (formData.category && !categories.includes(formData.category)) {
        await addDoc(collection(db, 'trainingCategories'), {
          name: formData.category,
          createdAt: serverTimestamp()
        })
      }

      // Create the module
      await addDoc(collection(db, 'trainingModules'), {
        ...formData,
        checklist: checklistItems,
        comments: [],
        createdBy: user.uid,
        createdByEmail: user.email,
        createdAt: serverTimestamp()
      })

      // Reset form
      setFormData({ title: '', description: '', loomUrl: '', category: '' })
      setChecklistItems([])
      setShowCreateForm(false)
      loadModules()
      loadCategories()
    } catch (error) {
      console.error('Error creating module:', error)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!isAdmin) return
    
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        await deleteDoc(doc(db, 'trainingModules', moduleId))
        loadModules()
        setSelectedModule(null)
      } catch (error) {
        console.error('Error deleting module:', error)
      }
    }
  }

  const handleAddComment = async () => {
    if (!user || !selectedModule || !commentText.trim()) return

    try {
      const moduleRef = doc(db, 'trainingModules', selectedModule.id)
      const newComment = {
        id: Date.now().toString(),
        text: commentText,
        asanaTaskUrl: asanaTaskUrl || undefined,
        createdBy: user.uid,
        createdByEmail: user.email!,
        createdAt: new Date()
      }

      await updateDoc(moduleRef, {
        comments: arrayUnion(newComment)
      })

      setCommentText('')
      setAsanaTaskUrl('')
      loadModules()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const extractLoomVideoId = (url: string) => {
    const match = url.match(/(?:share|embed)\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  const handleCategoryInput = (value: string) => {
    setFormData({ ...formData, category: value })
    if (value) {
      const filtered = categories.filter(cat => 
        cat.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredCategories(filtered)
      setShowCategoryDropdown(true)
    } else {
      setShowCategoryDropdown(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center group">
                <svg className="w-6 h-6 mr-2 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <Image
                  src="/images/tgm-logo-icon.png"
                  alt="TGM"
                  width={32}
                  height={32}
                  className="mr-3"
                />
                <h1 className="text-xl font-semibold text-gray-900">Training & SOPs</h1>
              </Link>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              + New Module
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module List or Create Form */}
        {showCreateForm ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Create Training Module</h2>
            <form onSubmit={handleCreateModule}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loom URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.loom.com/share/..."
                    value={formData.loomUrl}
                    onChange={(e) => setFormData({ ...formData, loomUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => handleCategoryInput(e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {showCategoryDropdown && filteredCategories.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {filteredCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, category: cat })
                            setShowCategoryDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Items</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={checklistItem}
                      onChange={(e) => setChecklistItem(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (checklistItem.trim()) {
                            setChecklistItems([...checklistItems, checklistItem])
                            setChecklistItem('')
                          }
                        }
                      }}
                      placeholder="Add checklist item..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (checklistItem.trim()) {
                          setChecklistItems([...checklistItems, checklistItem])
                          setChecklistItem('')
                        }
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {checklistItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm">• {item}</span>
                        <button
                          type="button"
                          onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Module
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ title: '', description: '', loomUrl: '', category: '' })
                    setChecklistItems([])
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : selectedModule ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Module Display */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold">{selectedModule.title}</h2>
                <p className="text-gray-600 mt-1">{selectedModule.description}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {selectedModule.category}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedModule(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteModule(selectedModule.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loom Video */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Training Video</h3>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {extractLoomVideoId(selectedModule.loomUrl) ? (
                    <iframe
                      src={`https://www.loom.com/embed/${extractLoomVideoId(selectedModule.loomUrl)}`}
                      frameBorder="0"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Invalid Loom URL
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Checklist</h3>
                <div className="space-y-2">
                  {selectedModule.checklist.map((item, index) => (
                    <label key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <input type="checkbox" className="h-5 w-5 text-purple-600 rounded" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Comments & Tasks</h3>
              <div className="space-y-4">
                {selectedModule.comments?.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{comment.text}</p>
                    {comment.asanaTaskUrl && (
                      <a
                        href={comment.asanaTaskUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-700 mt-1 inline-block"
                      >
                        View Asana Task →
                      </a>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      By {comment.createdByEmail} • {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Comment Form */}
              <div className="mt-4 space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
                <input
                  type="url"
                  value={asanaTaskUrl}
                  onChange={(e) => setAsanaTaskUrl(e.target.value)}
                  placeholder="Asana task URL (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Module Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setSelectedModule(module)}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
              >
                <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{module.description}</p>
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                  {module.category}
                </span>
                <div className="mt-4 flex items-center text-xs text-gray-500">
                  <span>By {module.createdByEmail}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
