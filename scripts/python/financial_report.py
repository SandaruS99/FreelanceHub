import os
import pandas as pd
import matplotlib.pyplot as plt
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load env from root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, '.env.local')
load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv('MONGODB_URI')

def get_db():
    client = MongoClient(MONGODB_URI)
    db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'freelancehub'
    return client[db_name]

def generate_report():
    print(f"Generating Financial Report at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}...")
    db = get_db()
    
    # 1. Fetch Data
    invoices = list(db.invoices.find({}))
    if not invoices:
        print("No invoice data found.")
        return
        
    df = pd.DataFrame(invoices)
    
    # Clean data
    df['total'] = pd.to_numeric(df['total'], errors='coerce').fillna(0)
    df['createdAt'] = pd.to_datetime(df['createdAt'])
    df['month_year'] = df['createdAt'].dt.to_period('M')
    
    # 2. Key Metrics
    total_revenue = df[df['status'] == 'paid']['total'].sum()
    pending_revenue = df[df['status'] != 'paid']['total'].sum()
    total_invoiced = df['total'].sum()
    
    print(f"\n--- Financial Summary ---")
    print(f"Total Invoiced:  ${total_invoiced:,.2f}")
    print(f"Total Collected: ${total_revenue:,.2f}")
    print(f"Total Pending:   ${pending_revenue:,.2f}")
    
    # 3. Monthly Growth
    monthly_stats = df.groupby('month_year')['total'].sum().reset_index()
    monthly_stats['month_year'] = monthly_stats['month_year'].astype(str)
    
    # 4. Generate Charts
    reports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'reports'))
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
        
    plt.figure(figsize=(10, 6))
    plt.bar(monthly_stats['month_year'], monthly_stats['total'], color='skyblue')
    plt.title('Monthly Invoiced Revenue')
    plt.xlabel('Month')
    plt.ylabel('Revenue ($)')
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    chart_path = os.path.join(reports_dir, f"revenue_chart_{datetime.now().strftime('%Y%m%d')}.png")
    plt.savefig(chart_path)
    print(f"Revenue chart saved to: {chart_path}")
    
    # 5. Export to Excel
    excel_path = os.path.join(reports_dir, f"financial_report_{datetime.now().strftime('%Y%m%d')}.xlsx")
    
    # Create multiple sheets
    with pd.ExcelWriter(excel_path) as writer:
        # Summary Overview
        summary_df = pd.DataFrame({
            'Metric': ['Total Invoiced', 'Total Collected (Paid)', 'Total Pending'],
            'Value': [total_invoiced, total_revenue, pending_revenue]
        })
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # All Invoices (excluding sensitive bits)
        cols_to_export = ['invoiceNumber', 'status', 'total', 'subtotal', 'taxTotal', 'createdAt', 'dueDate']
        df[cols_to_export].to_excel(writer, sheet_name='Invoices', index=False)
        
        # Monthly Stats
        monthly_stats.to_excel(writer, sheet_name='Monthly Breakdown', index=False)

    print(f"Excel report saved to: {excel_path}")
    
    # Final cleanup
    plt.close()

if __name__ == "__main__":
    generate_report()
