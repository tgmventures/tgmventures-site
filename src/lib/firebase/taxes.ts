import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { TaxReturn } from '@/types/goal';

const TAX_COLLECTION = 'taxes';

export interface TaxFilingsData {
  returns: TaxReturn[];
  propertyTaxH1Paid: boolean;
  propertyTaxH2Paid: boolean;
  createdAt: any;
  lastUpdated: any;
}

// Get the prior tax year (current year - 1)
export function getPriorTaxYear(): number {
  return new Date().getFullYear() - 1;
}

// Get tax filings data including returns and property taxes
export async function getTaxFilingsData(): Promise<TaxFilingsData> {
  const year = getPriorTaxYear();
  const docId = `taxes-${year}`;
  const docRef = doc(db, TAX_COLLECTION, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data() as TaxFilingsData;
    return {
      returns: data.returns || [],
      propertyTaxH1Paid: data.propertyTaxH1Paid || false,
      propertyTaxH2Paid: data.propertyTaxH2Paid || false,
      createdAt: data.createdAt,
      lastUpdated: data.lastUpdated
    };
  } else {
    // Initialize with default tax returns
    const defaultReturns: TaxReturn[] = [
      {
        id: '1',
        entity: 'Antonio Mandarano',
        country: '🇺🇸',
        year,
        isFiled: false,
        lastUpdated: new Date()
      },
      {
        id: '2',
        entity: 'TGM Ventures, Inc.',
        country: '🇺🇸',
        year,
        isFiled: false,
        lastUpdated: new Date()
      },
      {
        id: '3',
        entity: 'Antonio Mandarano',
        country: '🇨🇴',
        year,
        isFiled: false,
        lastUpdated: new Date()
      },
      {
        id: '4',
        entity: 'CO Holdings SAS',
        country: '🇨🇴',
        year,
        isFiled: false,
        lastUpdated: new Date()
      }
    ];
    
    await setDoc(docRef, {
      year,
      returns: defaultReturns,
      propertyTaxH1Paid: false,
      propertyTaxH2Paid: false,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    
    return {
      returns: defaultReturns,
      propertyTaxH1Paid: false,
      propertyTaxH2Paid: false,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };
  }
}

// Get just tax returns (for backwards compatibility)
export async function getTaxReturns(): Promise<TaxReturn[]> {
  const data = await getTaxFilingsData();
  return data.returns;
}

// Update a specific tax return status
export async function updateTaxReturnStatus(taxReturnId: string, isFiled: boolean): Promise<void> {
  const year = getPriorTaxYear();
  const docId = `taxes-${year}`;
  const docRef = doc(db, TAX_COLLECTION, docId);
  
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const returns = data.returns || [];
    const updatedReturns = returns.map((tr: TaxReturn) => {
      if (tr.id === taxReturnId) {
        const updated: any = { ...tr, isFiled, lastUpdated: new Date() };
        if (isFiled) {
          updated.completedAt = new Date();
        } else {
          updated.completedAt = null;
        }
        return updated;
      }
      return tr;
    });
    
    await updateDoc(docRef, {
      returns: updatedReturns,
      lastUpdated: serverTimestamp()
    });
  }
}

// Update property tax status (stored with current year's tax data)
export async function updatePropertyTaxStatus(period: 'H1' | 'H2', isPaid: boolean): Promise<void> {
  // Property taxes are for the current year, but we store them with the prior year's tax filing data
  const year = getPriorTaxYear();
  const docId = `taxes-${year}`;
  const docRef = doc(db, TAX_COLLECTION, docId);
  
  const field = period === 'H1' ? 'propertyTaxH1Paid' : 'propertyTaxH2Paid';
  const completedField = period === 'H1' ? 'propertyTaxH1CompletedAt' : 'propertyTaxH2CompletedAt';
  
  const updates: any = {
    [field]: isPaid,
    lastUpdated: serverTimestamp()
  };
  
  if (isPaid) {
    updates[completedField] = serverTimestamp();
  } else {
    updates[completedField] = null;
  }
  
  await updateDoc(docRef, updates);
}
