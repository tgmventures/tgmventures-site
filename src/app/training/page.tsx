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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null)
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
  const [editingModuleChecklistId, setEditingModuleChecklistId] = useState<string | null>(null)
  const [editModuleChecklistText, setEditModuleChecklistText] = useState('')
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

  // Add ESC key listener for closing module view
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedModule) {
        setSelectedModule(null)
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [selectedModule])

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
      setCategories(categoriesData.sort((a, b) => a.name.localeCompare(b.name)))
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

      // Create or update the module
      const moduleData = {
        ...formData,
        checklist: checklistItems,
        comments: editingModule ? editingModule.comments : [],
        createdBy: editingModule ? editingModule.createdBy : user.uid,
        createdByEmail: editingModule ? editingModule.createdByEmail : user.email,
        createdAt: editingModule ? editingModule.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      if (editingModule) {
        // Update existing module
        await updateDoc(doc(db, 'trainingModules', editingModule.id), moduleData)
      } else {
        // Create new module
        await addDoc(collection(db, 'trainingModules'), moduleData)
      }

      // Reset form
      setFormData({ title: '', description: '', loomUrl: '', mainCategory: '', subCategory: '' })
      setChecklistItems([])
      setShowCreateForm(false)
      setEditingModule(null)
      loadModules()
      loadCategories()
    } catch (error) {
      console.error('Error saving module:', error)
    }
  }

  const handleEditModule = (module: TrainingModule) => {
    setEditingModule(module)
    setFormData({
      title: module.title,
      description: module.description,
      loomUrl: module.loomUrl,
      mainCategory: module.mainCategory,
      subCategory: module.subCategory
    })
    setChecklistItems(module.checklist)
    setShowCreateForm(true)
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

  const handleEditModuleChecklistItem = async (itemId: string, newText: string) => {
    if (!selectedModule || !newText.trim()) {
      setEditingModuleChecklistId(null)
      setEditModuleChecklistText('')
      return
    }

    try {
      const moduleRef = doc(db, 'trainingModules', selectedModule.id)
      const updatedChecklist = selectedModule.checklist.map(item =>
        item.id === itemId ? { ...item, text: newText.trim() } : item
      )

      await updateDoc(moduleRef, {
        checklist: updatedChecklist
      })

      setEditingModuleChecklistId(null)
      setEditModuleChecklistText('')
      loadModules()
      
      // Update the selected module locally
      setSelectedModule({
        ...selectedModule,
        checklist: updatedChecklist
      })
    } catch (error) {
      console.error('Error updating checklist item:', error)
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

  const toggleSubCategory = (subCategory: string) => {
    setSelectedSubCategories(prev => 
      prev.includes(subCategory) 
        ? prev.filter(s => s !== subCategory)
        : [...prev, subCategory]
    )
  }

  const getFilteredModules = () => {
    let filtered = modules

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.mainCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subCategory.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(m => m.mainCategory === selectedCategory)
    }

    // Filter by subcategories (if any selected)
    if (selectedSubCategories.length > 0) {
      filtered = filtered.filter(m => selectedSubCategories.includes(m.subCategory))
    }

    return filtered
  }

  const getAvailableSubCategories = () => {
    if (!selectedCategory) return []
    const category = categories.find(c => c.name === selectedCategory)
    return category?.subCategories || []
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
      <header className="bg-white shadow-sm border-b border-gray-100 fixed top-0 left-0 right-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center flex-1">
              <Link href="/dashboard" className="mr-4">
                <Image
                  src="/images/tgm-logo-icon.png"
                  alt="TGM"
                  width={32}
                  height={32}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              </Link>
              <button 
                onClick={() => setSelectedModule(null)}
                className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                Training & SOPs
              </button>
              
              {/* Search Bar in Nav */}
              <div className="relative max-w-md flex-1 ml-8">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search all modules..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowCreateForm(true)
                setEditingModule(null)
                setFormData({ title: '', description: '', loomUrl: '', mainCategory: '', subCategory: '' })
                setChecklistItems([])
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 ml-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Module
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Simplified Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-16 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
            
            {/* All Modules */}
            <button
              onClick={() => {
                setSelectedCategory(null)
                setSelectedSubCategories([])
                setSelectedModule(null)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2 ${
                !selectedCategory ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Modules
            </button>

            {/* Category Buttons */}
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.name)
                    setSelectedSubCategories([])
                    setSelectedModule(null)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.name 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {showCreateForm ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">
                  {editingModule ? 'Edit Training Module' : 'Create Training Module'}
                </h2>
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
                      {editingModule ? 'Update Module' : 'Create Module'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false)
                        setEditingModule(null)
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
            </div>
          ) : selectedModule ? (
            <div className="max-w-6xl mx-auto">
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
                    {(isAdmin || selectedModule.createdBy === user?.uid) && (
                      <button
                        onClick={() => handleEditModule(selectedModule)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
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

                <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
                  {/* Loom Video - 30% larger */}
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

                  {/* Checklist - Smaller */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Checklist</h3>
                    <div className="space-y-2">
                      {selectedModule.checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                          <input type="checkbox" className="h-5 w-5 text-purple-600 rounded" />
                          {editingModuleChecklistId === item.id ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault()
                                handleEditModuleChecklistItem(item.id, editModuleChecklistText)
                              }}
                              className="flex-1"
                            >
                              <input
                                type="text"
                                value={editModuleChecklistText}
                                onChange={(e) => setEditModuleChecklistText(e.target.value)}
                                className="w-full text-sm px-2 py-1 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                autoFocus
                                onBlur={() => handleEditModuleChecklistItem(item.id, editModuleChecklistText)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setEditingModuleChecklistId(null)
                                    setEditModuleChecklistText('')
                                  }
                                }}
                              />
                            </form>
                          ) : (
                            <span 
                              onDoubleClick={() => {
                                if (isAdmin || selectedModule.createdBy === user?.uid) {
                                  setEditingModuleChecklistId(item.id)
                                  setEditModuleChecklistText(item.text)
                                }
                              }}
                              className="text-sm flex-1 cursor-pointer"
                            >
                              {item.text}
                            </span>
                          )}
                        </div>
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
            </div>
          ) : (
            /* Module Grid with Subcategory Filters */
            <div>
              {/* Title and Subcategory Filters */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {selectedCategory 
                    ? `${selectedCategory} Training`
                    : searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : 'All Training Modules'
                  }
                </h2>
                
                {/* Subcategory Filter Tags */}
                {selectedCategory && getAvailableSubCategories().length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getAvailableSubCategories().map((subCategory) => (
                      <button
                        key={`${selectedCategory}-${subCategory}`}
                        onClick={() => toggleSubCategory(subCategory)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedSubCategories.includes(subCategory)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {subCategory}
                      </button>
                    ))}
                    {selectedSubCategories.length > 0 && (
                      <button
                        onClick={() => setSelectedSubCategories([])}
                        className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
                
                <p className="text-gray-600 mt-3">
                  {getFilteredModules().length} module{getFilteredModules().length !== 1 ? 's' : ''} found
                </p>
              </div>

              {getFilteredModules().length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No modules found. Create your first training module to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredModules().map((module) => {
                    const videoId = extractLoomVideoId(module.loomUrl)
                    const isPlaying = playingVideoId === module.id
                    
                    return (
                      <div
                        key={module.id}
                        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                      >
                        {/* Embedded Video Player */}
                        <div className="aspect-video bg-gray-100 relative">
                          {videoId ? (
                            isPlaying ? (
                              <iframe
                                src={`https://www.loom.com/embed/${videoId}?autoplay=1`}
                                frameBorder="0"
                                allowFullScreen
                                className="w-full h-full"
                                allow="autoplay"
                              />
                            ) : (
                              <div
                                onClick={() => setPlayingVideoId(module.id)}
                                className="relative w-full h-full cursor-pointer group"
                              >
                                <iframe
                                  src={`https://www.loom.com/embed/${videoId}`}
                                  frameBorder="0"
                                  className="w-full h-full pointer-events-none"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                  <div className="bg-white/90 rounded-full p-3 shadow-lg transform group-hover:scale-110 transition-transform">
                                    <svg className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="p-6">
                          <h3 
                            onClick={() => setSelectedModule(module)}
                            className="font-semibold text-gray-900 mb-2 line-clamp-1 cursor-pointer hover:text-purple-600"
                          >
                            {module.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                {module.mainCategory}
                              </span>
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {module.subCategory}
                              </span>
                            </div>
                            {(isAdmin || module.createdBy === user?.uid) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditModule(module)
                                }}
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
