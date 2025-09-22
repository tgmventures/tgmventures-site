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
  arrayUnion,
  where
} from 'firebase/firestore'

interface ChecklistItem {
  id: string
  text: string
  isChecked: boolean
  order: number
}

interface TrainingModule {
  id: string
  title: string
  description: string
  loomUrl: string
  mainCategory: string
  subCategory: string
  checklist: ChecklistItem[]
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

interface Category {
  id: string
  name: string
  subCategories: string[]
}

export default function TrainingPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    loomUrl: '',
    mainCategory: '',
    subCategory: ''
  })
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [addingChecklistItem, setAddingChecklistItem] = useState(false)
  const [newChecklistText, setNewChecklistText] = useState('')
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null)
  const [editChecklistText, setEditChecklistText] = useState('')
  const [commentText, setCommentText] = useState('')
  const [asanaTaskUrl, setAsanaTaskUrl] = useState('')
  const [showMainCategoryDropdown, setShowMainCategoryDropdown] = useState(false)
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false)
  const [filteredMainCategories, setFilteredMainCategories] = useState<Category[]>([])
  const [filteredSubCategories, setFilteredSubCategories] = useState<string[]>([])

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
      const modulesData = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          loomUrl: data.loomUrl || '',
          mainCategory: data.mainCategory || data.category || '',
          subCategory: data.subCategory || '',
          checklist: Array.isArray(data.checklist) ? data.checklist : [],
          comments: Array.isArray(data.comments) ? data.comments : [],
          createdBy: data.createdBy || '',
          createdByEmail: data.createdByEmail || '',
          createdAt: data.createdAt
        } as TrainingModule
      })
      setModules(modulesData)
    } catch (error) {
      console.error('Error loading modules:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'trainingCategories'))
      const categoriesData = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          subCategories: data.subCategories || []
        } as Category
      })
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return
    
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistText.trim(),
      isChecked: false,
      order: checklistItems.length
    }
    
    setChecklistItems([...checklistItems, newItem])
    setNewChecklistText('')
    setAddingChecklistItem(false)
  }

  const handleEditChecklistItem = (itemId: string, newText: string) => {
    if (!newText.trim()) return
    
    setChecklistItems(checklistItems.map(item => 
      item.id === itemId ? { ...item, text: newText.trim() } : item
    ))
    setEditingChecklistId(null)
    setEditChecklistText('')
  }

  const handleDeleteChecklistItem = (itemId: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== itemId))
  }

  const startEditingChecklistItem = (itemId: string, currentText: string) => {
    setEditingChecklistId(itemId)
    setEditChecklistText(currentText)
  }

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      // Add or update category
      let categoryDoc = categories.find(cat => cat.name.toLowerCase() === formData.mainCategory.toLowerCase())
      
      if (!categoryDoc) {
        // Create new category
        const newCategoryRef = await addDoc(collection(db, 'trainingCategories'), {
          name: formData.mainCategory,
          subCategories: [formData.subCategory],
          createdAt: serverTimestamp()
        })
        categoryDoc = {
          id: newCategoryRef.id,
          name: formData.mainCategory,
          subCategories: [formData.subCategory]
        }
      } else if (!categoryDoc.subCategories.includes(formData.subCategory)) {
        // Add subcategory to existing category
        await updateDoc(doc(db, 'trainingCategories', categoryDoc.id), {
          subCategories: arrayUnion(formData.subCategory)
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
      setFormData({ title: '', description: '', loomUrl: '', mainCategory: '', subCategory: '' })
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

  const handleMainCategoryInput = (value: string) => {
    setFormData({ ...formData, mainCategory: value, subCategory: '' })
    if (value) {
      const filtered = categories.filter(cat => 
        cat.name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredMainCategories(filtered)
      setShowMainCategoryDropdown(true)
    } else {
      setShowMainCategoryDropdown(false)
    }
  }

  const handleSubCategoryInput = (value: string) => {
    setFormData({ ...formData, subCategory: value })
    if (value && formData.mainCategory) {
      const category = categories.find(cat => 
        cat.name.toLowerCase() === formData.mainCategory.toLowerCase()
      )
      if (category && category.subCategories) {
        const filtered = (category.subCategories || []).filter(sub => 
          sub.toLowerCase().includes(value.toLowerCase())
        )
        setFilteredSubCategories(filtered)
        setShowSubCategoryDropdown(true)
      }
    } else {
      setShowSubCategoryDropdown(false)
    }
  }

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    )
  }

  const getModulesByCategory = (mainCat: string, subCat: string) => {
    return modules.filter(m => 
      m.mainCategory === mainCat && m.subCategory === subCat
    )
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Category</label>
                    <input
                      type="text"
                      required
                      value={formData.mainCategory}
                      onChange={(e) => handleMainCategoryInput(e.target.value)}
                      onFocus={() => setShowMainCategoryDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {showMainCategoryDropdown && filteredMainCategories.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {filteredMainCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, mainCategory: cat.name, subCategory: '' })
                              setShowMainCategoryDropdown(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100"
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                    <input
                      type="text"
                      required
                      value={formData.subCategory}
                      onChange={(e) => handleSubCategoryInput(e.target.value)}
                      onFocus={() => formData.mainCategory && setShowSubCategoryDropdown(true)}
                      disabled={!formData.mainCategory}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    />
                    {showSubCategoryDropdown && filteredSubCategories.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {filteredSubCategories.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, subCategory: sub })
                              setShowSubCategoryDropdown(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100"
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Items</label>
                  <div className="space-y-2">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 group">
                        <span className="text-gray-400">{item.order + 1}.</span>
                        {editingChecklistId === item.id ? (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault()
                              handleEditChecklistItem(item.id, editChecklistText)
                            }}
                            className="flex-1 flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={editChecklistText}
                              onChange={(e) => setEditChecklistText(e.target.value)}
                              className="flex-1 text-sm px-2 py-1 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              autoFocus
                              onBlur={() => handleEditChecklistItem(item.id, editChecklistText)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingChecklistId(null)
                                  setEditChecklistText('')
                                }
                              }}
                            />
                          </form>
                        ) : (
                          <span 
                            onClick={() => startEditingChecklistItem(item.id, item.text)}
                            className="flex-1 text-sm cursor-pointer hover:text-purple-600"
                          >
                            {item.text}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    {addingChecklistItem ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleAddChecklistItem()
                        }}
                        className="flex items-center gap-2 mt-2"
                      >
                        <input
                          type="text"
                          value={newChecklistText}
                          onChange={(e) => setNewChecklistText(e.target.value)}
                          placeholder="Add checklist item..."
                          className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="text-green-600 hover:text-green-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingChecklistItem(false)
                            setNewChecklistText('')
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingChecklistItem(true)}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-all duration-200 mt-2"
                      >
                        + Add checklist item
                      </button>
                    )}
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
                    setFormData({ title: '', description: '', loomUrl: '', mainCategory: '', subCategory: '' })
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
                <div className="mt-2 flex gap-2">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {selectedModule.mainCategory}
                  </span>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {selectedModule.subCategory}
                  </span>
                </div>
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
                    <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <input type="checkbox" className="h-5 w-5 text-purple-600 rounded" />
                      <span className="text-sm">{item.text}</span>
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
          /* Category-based Module Organization */
          <div className="space-y-6">
            {categories.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500">No training modules yet. Create your first module to get started!</p>
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedCategories.includes(category.name) ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedCategories.includes(category.name) && (
                    <div className="border-t border-gray-100">
                      {(category.subCategories || []).map((subCategory) => {
                        const moduleCount = getModulesByCategory(category.name, subCategory).length
                        return (
                          <div key={subCategory} className="border-b border-gray-50 last:border-0">
                            <button
                              onClick={() => {
                                setSelectedMainCategory(category.name)
                                setSelectedSubCategory(subCategory)
                              }}
                              className="w-full px-8 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                            >
                              <span className="text-sm text-gray-700">{subCategory}</span>
                              <span className="text-xs text-gray-400">{moduleCount} module{moduleCount !== 1 ? 's' : ''}</span>
                            </button>
                            
                            {selectedMainCategory === category.name && selectedSubCategory === subCategory && (
                              <div className="px-8 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getModulesByCategory(category.name, subCategory).map((module) => (
                                  <button
                                    key={module.id}
                                    onClick={() => setSelectedModule(module)}
                                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left"
                                  >
                                    <h4 className="font-medium text-gray-900 mb-1">{module.title}</h4>
                                    <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
