# DAN Dashboard User Guide

## 📘 About This Guide

This guide explains how both dashboards work, what each feature does, and how calculations are performed. Written in simple language to help you understand your business data better.

---

## 🧭 Table of Contents

### Business Compass Dashboard
1. [Dataset Profile](#1-dataset-profile)
2. [Focus - Segment Priority](#2-focus---segment-priority)
3. [Targets](#3-targets)
4. [Cash - Outstanding Payments](#4-cash---outstanding-payments)
5. [Concentration - Customer Risk](#5-concentration---customer-risk)
6. [Expansion - Growth Opportunities](#6-expansion---growth-opportunities)
7. [Seasonality](#7-seasonality)
8. [On Track - Performance Monitoring](#8-on-track---performance-monitoring)
9. [Trends - Customer Analytics](#9-trends---customer-analytics)

### Sales Analysis Dashboard
1. [Overview](#sales-overview)
2. [Quarter Analysis](#sales-quarter-analysis)
3. [Week Analysis](#sales-week-analysis)
4. [Comparative Analysis](#sales-comparative-analysis)
5. [Customer Analysis](#sales-customer-analysis)

---

# 📊 Business Compass Dashboard

## 1. Dataset Profile

### What It Shows
A quick summary of your entire dataset at a glance.

### Features

#### **Total Revenue**
- **What it is:** The sum of all sales/invoices in your data
- **How it's calculated:** Adds up the "Total" column from all rows, including credit notes (negative values)
- **Why it matters:** Shows your overall business size

#### **Total Invoices**
- **What it is:** Count of all transactions/invoices in your dataset
- **How it's calculated:** Counts every row in your data file (after removing invalid rows)
- **Why it matters:** Indicates transaction volume and business activity

#### **Total Customers**
- **What it is:** Number of unique customers you've served
- **How it's calculated:** Counts distinct customer names/IDs
- **Why it matters:** Shows your customer base size

#### **Date Range**
- **What it is:** The time period covered by your data
- **How it's calculated:** From earliest invoice date to latest invoice date
- **Why it matters:** Helps you understand if you're looking at a month, quarter, or year of data

#### **Total Outstanding**
- **What it is:** Money owed to you by customers (unpaid invoices)
- **How it's calculated:** Sum of the "Outstanding" column for all invoices
- **Why it matters:** Shows how much cash is tied up waiting for payment

---

## 2. Focus - Segment Priority

### What It Shows
Breaks down your business by segments (branches, regions, or business units) to show which parts contribute most to revenue.

### Features

#### **Segment Revenue Breakdown Table**
Shows each segment with:

- **Revenue:** Total sales for that segment
  - **Calculation:** Sum of all invoice totals for that segment
  
- **% of Total:** What percentage of total business this segment represents
  - **Calculation:** `(Segment Revenue / Total Revenue) × 100`
  - **Example:** If NSW made $11M and total is $228M, then NSW = 4.8%
  
- **YoY % (Year-over-Year Growth):**
  - **What it is:** How much this segment grew compared to last year
  - **Calculation:** `((This Year Revenue - Last Year Revenue) / Last Year Revenue) × 100`
  - **Example:** If last year was $10M and this year is $11M: `(11-10)/10 × 100 = 10%` growth
  - **Shows as:** Green text for positive growth, red for decline

### Decision Guidance
The dashboard automatically identifies your **primary segment** (largest revenue) and provides strategic recommendations:
- If one segment dominates → Focus resources there
- If multiple segments are similar → Balance investment across them

---

## 3. Targets

### What It Shows
Helps you set realistic revenue targets based on your historical performance.

### Features

#### **Current Performance Metrics**
- **Current Run Rate:** How much you're making per month on average
  - **Calculation:** `Total Revenue / Number of Months in Data`
  
- **Projected Annual Revenue:** What you'll make if you continue at current pace
  - **Calculation:** `Monthly Run Rate × 12`

#### **Target Setting**
You can set a custom target (e.g., $250M for the year) and the dashboard shows:

- **Gap to Target:** How much more you need to make
  - **Calculation:** `Target - Current Projected Revenue`
  
- **Required Monthly Revenue:** What you need to average each month
  - **Calculation:** `Target / 12 months`
  
- **Monthly Increase Needed:** How much more per month vs current performance
  - **Calculation:** `Required Monthly - Current Monthly Average`

#### **Progress Breakdown by Segment**
Shows each segment's:
- Current revenue
- Target share (proportional to their current performance)
- Gap to meet their target portion

### Why It Matters
Helps you set realistic goals and understand what growth rate you need to achieve them.

---

## 4. Cash - Outstanding Payments

### What It Shows
Analyzes money owed to you by customers (accounts receivable).

### Features

#### **Total Outstanding Amount**
- **What it is:** Total unpaid invoices
- **How it's calculated:** Sum of "Outstanding" column from all invoices
- **Color coding:**
  - Green: Low outstanding (< 10% of revenue)
  - Yellow: Moderate (10-20% of revenue)
  - Red: High (> 20% of revenue) - potential cash flow risk

#### **Average Days Outstanding**
- **What it is:** Average number of days customers take to pay
- **How it's calculated:** For each customer: `Days Between Invoice Date and Today`
- **Typical ranges:**
  - 0-30 days: Excellent (Net 30 terms)
  - 31-60 days: Acceptable (Net 60 terms)
  - 60+ days: Concerning - may need collection efforts

#### **Outstanding by Segment**
Shows which branches/regions have the most unpaid invoices:
- **Segment:** Branch name
- **Outstanding Amount:** Total unpaid for that segment
- **% of Segment Revenue:** What portion of their sales is unpaid
  - **Calculation:** `(Outstanding / Total Segment Revenue) × 100`

#### **Top Outstanding Customers Table**
Lists customers with largest unpaid balances:
- **Customer Name**
- **Outstanding Amount**
- **% of Total Outstanding:** Their share of all unpaid invoices

### Decision Guidance
- If outstanding is high (>20%): Focus on collections, tighten credit terms
- If certain customers have large outstanding: Consider credit limits or prepayment
- If one segment has high outstanding %: Review that branch's credit policies

---

## 5. Concentration - Customer Risk

### What It Shows
Measures how much your business depends on a small number of customers. High concentration = higher risk if you lose a big customer.

### Features

#### **Top 5 % of Revenue**
- **What it is:** Percentage of total revenue from your 5 biggest customers
- **How it's calculated:** `(Revenue from Top 5 Customers / Total Revenue) × 100`
- **Risk levels:**
  - 40-60%: Healthy diversification
  - 60-70%: Moderate concentration
  - 70-80%: High concentration risk
  - >80%: Critical risk - losing one customer would hurt significantly

#### **Top 1 Customer %**
- **What it is:** Percentage of revenue from single largest customer
- **How it's calculated:** `(Biggest Customer Revenue / Total Revenue) × 100`
- **Risk levels:**
  - <20%: Low risk
  - 20-30%: Moderate
  - 30-40%: Elevated risk
  - >40%: High risk - very dependent on one customer

#### **Top 5 Customers Table**
Lists your biggest customers by revenue amount

### Smart Validation
The dashboard intelligently handles small datasets:
- If you have ≤ 5 customers total: Shows as "structural concentration" (not a risk, just small business size)
- If you have 6+ customers with high concentration: Flags as actual business risk

### Why It Matters
- **High concentration = risky:** If your top customer leaves, your revenue drops significantly
- **Low concentration = stable:** Business is spread across many customers
- **Strategy:** Try to win more mid-size customers to reduce dependency on a few large ones

---

## 6. Expansion - Growth Opportunities

### What It Shows
Identifies which segments (branches/regions) have growth potential based on their current size relative to your primary segment.

### Features

#### **Segment Comparison**
Compares each segment to your largest segment:

- **Primary Segment:** Your biggest revenue generator (100% baseline)
- **Secondary Segments:** Other branches shown as % of primary
  - **Calculation:** `(Segment Revenue / Primary Segment Revenue) × 100`

#### **Expansion Categories**

**Almost Equal (≥80% of primary)**
- These segments are nearly as large as your primary
- **Risk:** May be over-focused, lacking diversification
- **Strategy:** Maintain current performance, look for new markets

**Major Segment (50-79% of primary)**
- Significant contributors to revenue
- **Opportunity:** Still some growth potential to match primary
- **Strategy:** Invest in growth to bring them up to primary level

**Growing Segment (20-49% of primary)**
- Established but smaller segments
- **Opportunity:** High expansion potential
- **Strategy:** These are your best expansion opportunities - invest here

**Emerging (<20% of primary)**
- Small segments just starting
- **Opportunity:** Long-term growth potential
- **Strategy:** Nurture these, but they need time to mature

### Why It Matters
Helps you decide where to invest resources for growth. Don't just focus on your biggest segment - smaller segments may have more room to grow.

---

## 7. Seasonality

### What It Shows
Reveals patterns in your sales across different times of the year.

### Features

#### **Monthly Revenue Chart**
- **X-axis:** Months (Jan-Dec)
- **Y-axis:** Revenue amount
- **Lines:** Different colors for different years
- **How it's calculated:** Sum of all invoices grouped by month

#### **Quarterly Performance Table**
Shows revenue for each quarter:
- **Q1:** Jan-Mar (Weeks 1-13)
- **Q2:** Apr-Jun (Weeks 14-26)
- **Q3:** Jul-Sep (Weeks 27-39)
- **Q4:** Oct-Dec (Weeks 40-52)

#### **Week-over-Week Trends**
Shows weekly patterns:
- Which weeks are consistently high/low
- Helps identify busy vs slow periods

### Seasonal Patterns to Look For

**Consistent Peaks**
- Same month/quarter high every year = predictable seasonality
- Example: Retail businesses peak in Q4 (holidays)

**Troughs**
- Regular low periods
- Example: B2B services might be slow in summer

**Year-End Spikes**
- Many businesses rush orders in December (tax/budget reasons)

### Why It Matters
- **Cash flow planning:** Know when to expect high/low revenue
- **Inventory management:** Stock up before busy seasons
- **Staffing:** Hire temporary staff for peak periods
- **Marketing:** Push promotions during slow periods

---

## 8. On Track - Performance Monitoring

### What It Shows
Compares your actual performance against targets to see if you're meeting goals.

### Features

#### **Performance vs Target**
- **Target Revenue:** Your goal amount
- **Actual Revenue:** What you've actually achieved
- **Achievement %:** How close you are to target
  - **Calculation:** `(Actual / Target) × 100`

#### **Status Indicators**

**On Track (90-110% of target)**
- Status: ✅ Green
- Meaning: You're right where you should be
- Action: Keep doing what you're doing

**Slightly Behind (80-89% of target)**
- Status: ⚠️ Yellow
- Meaning: A bit below target, but recoverable
- Action: Identify what's slowing you down, make minor adjustments

**Below Target (<80%)**
- Status: 🔴 Red
- Meaning: Significantly behind
- Action: Urgent review needed - major course correction required

**Ahead of Target (>110%)**
- Status: 🎯 Blue
- Meaning: Exceeding expectations
- Action: Understand what's working so you can keep it up

#### **Segment Achievement Breakdown**
Shows each segment's performance:
- Target for that segment
- Actual achievement
- % to target
- Gap (shortfall or surplus)

### Why It Matters
Early warning system - catch problems while you can still fix them. Adjust strategy mid-period rather than waiting until year-end.

---

## 9. Trends - Customer Analytics

### What It Shows
Deep dive into customer behavior patterns over time.

### Features

#### **Customer Growth Chart**
- **X-axis:** Time period (months/quarters)
- **Y-axis:** Number of customers
- **Shows:** How your customer base is growing (or shrinking)

#### **Revenue per Customer Trend**
- **What it is:** Average revenue per customer over time
- **Calculation:** `Total Revenue / Number of Customers` for each period
- **Increasing trend:** Customers are buying more (good!)
- **Decreasing trend:** Customers spending less (investigate why)

#### **Customer Categories**

**New Customers**
- First purchase in current period
- **Metric:** Number and revenue from new customers
- **Healthy rate:** Should be continuously adding new customers

**Repeat Customers**
- Purchased before and purchased again
- **Metric:** What % of customers are repeat buyers
- **Calculation:** `(Repeat Customers / Total Active Customers) × 100`
- **Good rate:** >60% repeat rate = strong loyalty

**Churned Customers**
- Bought before but haven't bought recently
- **Definition:** No purchase in last X months (typically 3-6 months)
- **Metric:** Churn rate
- **Calculation:** `(Lost Customers / Total Customers) × 100`
- **Healthy rate:** <5-10% annual churn

#### **Top Growing Customers**
Lists customers whose spending increased most:
- Customer name
- Previous period revenue
- Current period revenue
- Growth %
  - **Calculation:** `((Current - Previous) / Previous) × 100`

#### **At-Risk Customers**
Customers showing warning signs:
- Decreasing purchase frequency
- Lowering order values
- Extended time since last purchase

### Why It Matters
- **Customer acquisition cost:** If you're losing customers fast, you spend more replacing them
- **Lifetime value:** Repeat customers are more profitable (no acquisition cost)
- **Growth strategy:** Easier to grow existing customers than find new ones

---

# 📈 Sales Analysis Dashboard

## Sales Overview

### What It Shows
High-level summary of your sales performance with key metrics and charts.

### Features

#### **Summary Cards**

**Total Revenue**
- Sum of all invoice amounts for selected period/branches
- Shows as large number at top of page

**Total Invoices**
- Count of transactions
- Indicator of business activity level

**Average Invoice Value**
- **Calculation:** `Total Revenue / Number of Invoices`
- Shows typical transaction size
- **Higher is better** for most businesses (larger deals)

**Active Branches**
- Number of branches/locations included in the view
- Changes based on your filter selection

#### **Revenue by Branch Chart (Pie/Bar)**
- **Pie Chart:** Shows proportion of revenue by each branch
  - Each slice = one branch
  - Size = revenue amount
  
- **Bar Chart:** Compares branches side-by-side
  - X-axis: Branch names
  - Y-axis: Revenue amount
  - Easy to see which branch is largest

#### **Monthly Sales Trend**
- **Line chart** showing revenue over time
- **X-axis:** Months
- **Y-axis:** Revenue
- **Multiple lines:** Different colors for different branches
- **Pattern analysis:**
  - Upward slope: Growing sales
  - Downward slope: Declining sales
  - Flat line: Stable performance
  - Spikes: Seasonal or one-time events

#### **Weekly Sales Overview**
Similar to monthly but broken down by week (1-52):
- More granular view of short-term trends
- Useful for identifying specific high/low performing weeks

---

## Sales Quarter Analysis

### What It Shows
Breaks down sales into 4 quarters for easier year-long analysis.

### Features

#### **Quarter Definitions**
- **Q1:** Weeks 1-13 (approximately Jan-Mar)
- **Q2:** Weeks 14-26 (approximately Apr-Jun)
- **Q3:** Weeks 27-39 (approximately Jul-Sep)
- **Q4:** Weeks 40-52 (approximately Oct-Dec)

#### **Quarterly Summary Table**
For each financial year and quarter:
- **Total Revenue:** Sum of all sales in that quarter
- **Revenue by Branch:** Breakdown by location
- **% of Annual:** What portion of yearly revenue came from this quarter
  - **Calculation:** `(Quarter Revenue / Annual Revenue) × 100`

#### **Quarterly Comparison Chart**
- **Stacked bar chart** with quarters on X-axis
- Each bar split by branch (different colors)
- Shows which quarters are strongest/weakest
- **Use case:** Plan inventory, staffing, and marketing around quarterly patterns

#### **Quarter Selector**
- Filter to see specific quarters (e.g., "Compare all Q4s")
- Select multiple quarters to see year-over-year comparison

#### **Growth Trends**
- Compare same quarter across different years
- **Example:** Q4 2023 vs Q4 2024
- **Calculation:** `((This Year - Last Year) / Last Year) × 100`

### Why Quarters Matter
- **Financial reporting:** Most businesses report quarterly
- **Seasonal planning:** Quarters align with seasons (Q4 = holiday, Q2 = summer)
- **Budget cycles:** Many companies budget by quarter

---

## Sales Week Analysis

### What It Shows
Most detailed view - individual week performance.

### Features

#### **Week Selector**
- Dropdown to select specific weeks (1-52)
- Multi-select to compare multiple weeks
- **If no selection:** Shows all weeks

#### **Weekly Sales Table**
For each week:
- **Week Number:** 1-52
- **Financial Year:** Which year this week belongs to
- **Branch:** Location
- **Total Sales:** Revenue for that week

#### **Pagination**
- Shows 10 weeks per page
- Navigation buttons to browse through all weeks
- Useful when you have years of data (hundreds of weeks)

#### **Weekly Sales Trend Chart**
- **Line graph** with weeks on X-axis
- **Multiple lines:** One for each branch per year combination
  - Example: "WA 2024", "WA 2023", "NSW 2024"
- **Color coding:** Same branch = same color family

#### **Week-over-Week Analysis**
Compare consecutive weeks:
- **Week 12 vs Week 11 change**
- **Calculation:** `((Week12 - Week11) / Week11) × 100`
- Identifies sudden jumps or drops

### Use Cases
- **Specific event impact:** "How did that promotion in Week 23 perform?"
- **Irregular patterns:** Find one-off anomalies
- **Weekly targets:** Track if sales are above/below weekly goals
- **Operational issues:** "Week 15 was low - what happened?"

---

## Sales Comparative Analysis

### What It Shows
Side-by-side comparison of different time periods, branches, or customer groups.

### Features

#### **Branch Comparison**
Compare performance across locations:
- **Revenue by Branch:** Total sales per location
- **Invoice Count by Branch:** Transaction volume
- **Average Invoice:** Which branch has largest typical order
  - **Calculation:** `Branch Revenue / Branch Invoice Count`

#### **Year-over-Year Comparison**
- Current year vs previous year
- Shows growth or decline for each metric

#### **Period-over-Period**
Compare any two custom date ranges:
- This month vs last month
- This quarter vs last quarter
- Current week vs same week last year

#### **Growth Rate Analysis**
For each comparison:
- **Absolute change:** Raw dollar difference
  - **Calculation:** `Current Period - Previous Period`
  
- **Percentage change:** Growth rate
  - **Calculation:** `((Current - Previous) / Previous) × 100`
  
- **Status indicator:**
  - 🟢 Green: Positive growth
  - 🔴 Red: Decline
  - ⚪ Gray: No change

#### **Comparison Charts**

**Side-by-Side Bars**
- Two bars per category (e.g., one for each year)
- Easy to see which performed better

**Stacked Comparison**
- Shows composition (% from each branch)
- Compares mix changes over time

### Use Cases
- **Regional strategy:** "Should we invest more in NSW or QLD?"
- **Performance evaluation:** "Is this branch improving?"
- **Target setting:** "Based on last year's growth, what's realistic for next year?"

---

## Sales Customer Analysis

### What It Shows
Everything about your customers - who they are, what they buy, and how behavior changes.

### Features

#### **Top Customers Table**
Lists highest-revenue customers:
- **Customer Name**
- **Total Revenue:** Lifetime or period value
- **Invoice Count:** How many times they've purchased
- **Average Order Value:** Revenue / Invoice Count
  - Shows if they're a "whale" (few big orders) or frequent small buyer
- **Last Purchase Date:** Recency indicator

#### **Customer Segmentation**

**By Revenue**
- **VIP Customers:** Top 10% by revenue
  - Often contribute 40-60% of total revenue
  - Deserve white-glove service
  
- **Regular Customers:** Middle 50%
  - Stable base of business
  - Opportunity to upgrade to VIP
  
- **Small Customers:** Bottom 40%
  - May be new or occasional buyers
  - Growth potential

**By Purchase Frequency**
- **Frequent (Weekly/Monthly):** Regular, predictable orders
- **Occasional (Quarterly):** Periodic needs
- **One-time:** May be project-based or trial customers

#### **Customer Growth Trends**
- **New Customers per Month:** Acquisition rate
- **Active Customers:** Currently purchasing
- **Reactivated Customers:** Returned after period of inactivity
- **Lost Customers:** No purchase in 6+ months

#### **Customer Lifetime Value (CLV)**
For each customer:
- **Total historical revenue**
- **Average purchase frequency**
- **Estimated future value** (if they continue)
- **Calculation:** `(Avg Order Value) × (Purchase Frequency per Year) × (Expected Years)`

#### **Purchase Patterns**
- **Typical order size:** Most common invoice amount
- **Purchase cycle:** Average days between orders
- **Growth trajectory:** Are they buying more over time?

#### **Customer Detail View**
Click any customer to see:
- Complete purchase history
- All invoices with dates and amounts
- Timeline of transactions
- Growth trend for this specific customer

#### **Customer Risk Indicators**

**At-Risk Customers**
- **Decreasing purchase frequency**
  - Example: Used to buy monthly, now quarterly
  
- **Declining order values**
  - Example: Orders decreased from $50K to $30K
  
- **Extended time since last purchase**
  - Example: Usually orders every 30 days, now 60 days since last order

**Healthy Customers**
- Increasing or stable purchase frequency
- Growing order sizes
- Recent purchase activity

### Customer Analysis Calculations

#### Retention Rate
**Formula:** `(Customers at End - New Customers) / Customers at Start × 100`

**Example:**
- Start of year: 100 customers
- End of year: 110 customers
- New customers added: 20
- Retention: `(110 - 20) / 100 × 100 = 90%`
- Meaning: You kept 90 of your original 100 customers

#### Customer Churn Rate
**Formula:** `(Customers Lost / Customers at Start) × 100`

**Example:**
- Started with 100 customers
- Lost 10 customers
- Churn: `10 / 100 × 100 = 10%`

#### Revenue Concentration
**Formula:** `(Top 10 Customers Revenue / Total Revenue) × 100`

**Example:**
- Top 10 customers: $5M
- Total revenue: $10M
- Concentration: `5 / 10 × 100 = 50%`
- Meaning: Half your revenue comes from just 10 customers (high risk)

---

# 🎯 How to Use These Dashboards Effectively

## Getting Started
1. **Upload your data** via the unified landing page (localhost:3002)
2. Choose your dashboard based on what you need to know:
   - **Business Compass:** Strategic decisions, risk assessment, target setting
   - **Sales Analysis:** Detailed sales trends, operational insights, customer deep-dive

## Before Making Decisions

### Check Data Quality
- Verify the date range is what you expect
- Check that all branches are included
- Ensure invoice count matches your expectations
- Look for any validation warnings at the top

### Understand Context
- **Seasonal businesses:** Compare Q4 to Q4, not Q4 to Q2
- **Growing businesses:** YoY comparisons more meaningful than month-to-month
- **New products/branches:** May need 6-12 months before patterns emerge

## Common Questions Answered

### "My revenue doesn't match my accounting system"
Check:
1. **Date range:** Are you comparing the same periods?
2. **Credit notes:** Dashboard includes negative values (refunds), some systems exclude them
3. **Outstanding amounts:** Dashboard shows invoiced amounts, not collected cash
4. **Branch filters:** Make sure all branches are selected

### "Why is my concentration so high?"
- If you have < 10 customers, this is normal (structural, not risky)
- If you have many customers but high concentration, consider:
  - Diversifying your customer base
  - Marketing to mid-size prospects
  - Not over-relying on one big client

### "What's a good target growth rate?"
- **Conservative:** 5-10% year-over-year
- **Moderate:** 10-20% YoY
- **Aggressive:** 20-50% YoY
- **Hyper-growth:** >50% YoY (usually startups)

Consider:
- Your industry average
- Current economic conditions
- Your capacity to deliver (can you handle 2x customers?)

### "How do I improve customer retention?"
1. Check Customer Analysis → At-Risk Customers
2. Reach out before they churn (when you see warning signs)
3. Look at churned customers → find common patterns
4. Compare repeat customers vs one-time → what's different?

### "Which segment should I focus on?"
Look at:
1. **Expansion tab:** Which segments have room to grow?
2. **Concentration tab:** Are you too dependent on one segment?
3. **Seasonality tab:** Which segments are most stable?
4. **Trends tab:** Which segments are growing naturally?

**Strategy:** Often best to invest in segment that's 20-40% of your primary (high growth potential, proven market fit)

---

# 📚 Glossary

**Invoice:** A bill or transaction record

**Revenue:** Total sales/income from invoices

**Outstanding:** Unpaid portion of invoices (money owed to you)

**Segment:** A division of your business (branch, region, product line)

**YoY (Year-over-Year):** Comparing same period in different years (Q1 2024 vs Q1 2023)

**Concentration:** How much business comes from a small number of customers

**Churn:** Customers who stop buying from you

**Retention:** Keeping existing customers

**CLV (Customer Lifetime Value):** Total revenue expected from a customer over their entire relationship

**Run Rate:** Current rate of revenue, projected for a full year

**Seasonality:** Predictable patterns based on time of year

**Quarter:** 3-month period (4 quarters in a year)

**Financial Year:** Your company's yearly cycle (may differ from calendar year)

**On Track:** Meeting targets within acceptable range (90-110%)

**Primary Segment:** Your largest revenue-producing division

**At-Risk Customer:** Customer showing signs they might stop buying

**Net Revenue:** Total revenue minus refunds/returns (includes negatives)

---

# 🔧 Troubleshooting

## Browser Issues

**Dashboard not loading**
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Clear browser cache
- Try incognito/private window

**Wrong data showing**
- Check filters at top of dashboard
- Verify you uploaded the correct file
- Check date range selector

**Slow performance**
- Large datasets (>100K rows) may take time to load
- Close other browser tabs
- Try Chrome or Firefox (best performance)

## Data Issues

**Revenue seems too low**
- Check if all branches are selected in filter
- Verify date range includes all desired periods
- Ensure negative values (credit notes) aren't being double-counted

**Missing customers**
- Check for duplicate customer names with different spellings
- Verify customer column has data (not blank)
- Check if branch filter is excluding some customers

**Charts not displaying**
- May need to select a time period first
- Some charts require minimum data (e.g., can't show trends with only 1 week)
- Check console for errors (F12 → Console tab)

## Need More Help?

1. Check that services are running: `./start-all-services.sh`
2. View logs: `tail -f logs/*.log`
3. Restart specific service if needed
4. Re-upload your data file

---

# 📝 Best Practices

## Data Preparation

✅ **DO:**
- Keep customer names consistent (don't mix "ABC Corp" and "ABC Corporation")
- Include branch/region information
- Use consistent date formats
- Include all invoices (positive and negative for refunds)

❌ **DON'T:**
- Mix different time periods in one file
- Include test/dummy data
- Have blank rows in middle of data
- Use special characters in customer names (breaks some charts)

## Using the Dashboards

✅ **DO:**
- Review all sections, not just revenue
- Compare periods (YoY, QoQ)
- Look for trends, not just snapshots
- Check data quality warnings
- Export reports before big decisions

❌ **DON'T:**
- Make decisions from single metric
- Ignore seasonal patterns
- Compare different time periods directly
- Overlook customer concentration risk
- Forget to filter by relevant branches

## Action Items

After reviewing dashboards, create action plans:

1. **Immediate (this week):**
   - Contact at-risk customers
   - Follow up on large outstanding invoices
   - Address any data quality issues

2. **Short-term (this month):**
   - Adjust marketing based on segment analysis
   - Set realistic targets from trends
   - Plan inventory for seasonal patterns

3. **Long-term (this quarter/year):**
   - Diversify if concentration is high
   - Invest in expansion opportunities
   - Improve customer retention strategies

---

**Last Updated:** March 2026  
**Dashboards Version:** Latest  
**Questions?** Refer to this guide or check the logs for technical issues.
