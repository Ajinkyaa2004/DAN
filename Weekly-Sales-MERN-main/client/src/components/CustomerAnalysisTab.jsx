import React from 'react';
import { Users } from 'lucide-react';
import CustomerTrends from './CustomerTrends';
import CustomerPurchaseDetail from './CustomerPurchaseDetail';
import './CustomerAnalysisTab.css';

function CustomerAnalysisTab({ filteredData, selectedBranches }) {
  return (
    <div className="customer-analysis-tab">
      <h2 className="main-title"><Users size={22} style={{marginRight:'0.5rem', verticalAlign:'middle'}} />Customer Analysis</h2>
      
      {/* Customer Trends Section */}
      <CustomerTrends
        filteredData={filteredData}
        selectedBranches={selectedBranches}
      />

      {/* Customer Purchase Detail Section */}
      <CustomerPurchaseDetail
        filteredData={filteredData}
      />
    </div>
  );
}

export default CustomerAnalysisTab;
