#!/usr/bin/env python3
import re

# Read the file
with open('src/pages/ContabilidadNew.jsx', 'r') as f:
    content = f.read()

# 1. Add imports at the top
content = content.replace(
    "import '../styles/globals.css'",
    "import OrderModal from '../components/OrderModal'\nimport CustomerModal from '../components/CustomerModal'\nimport '../styles/globals.css'"
)

# 2. Replace expansion states with modals
old_states = """  // Estados de expansión
  const [expandedOrders, setExpandedOrders] = useState({})
  const [expandedOrderCustomers, setExpandedOrderCustomers] = useState({})
  const [expandedOrderProducts, setExpandedOrderProducts] = useState({})
  const [expandedCustomers, setExpandedCustomers] = useState({})
  const [expandedCustomerOrders, setExpandedCustomerOrders] = useState({})
  const [expandedCustomerProducts, setExpandedCustomerProducts] = useState({})
  
  // Estados de edición
  const [editingCharge, setEditingCharge] = useState(null)
  const [changingOrderCharge, setChangingOrderCharge] = useState(null)"""

new_states = """  // Modales
  const [orderModal, setOrderModal] = useState(null)
  const [customerModal, setCustomerModal] = useState(null)
  
  // Estados de edición
  const [editingCharge, setEditingCharge] = useState(null)"""

content = content.replace(old_states, new_states)

# 3. Remove all toggle functions
pattern = r'  function toggle\w+\([^)]+\)[^}]+\{[^}]+\}\n\n'
content = re.sub(pattern, '', content, flags=re.MULTILINE)

# 4. Remove saveOrderChange and returnToExcess functions
pattern = r'  async function (?:saveOrderChange|returnToExcess)\([^)]*\)[^{]*\{(?:[^}]|\}(?!\n\n))*\}\n\n'
content = re.sub(pattern, '', content, flags=re.MULTILINE | re.DOTALL)

# 5. Replace order cards mapping
old_order_mapping = r'(\{filteredOrderCards\.map\(\(o\)=> \{\s+const orderId = o\.order\.id\s+const isExpanded = expandedOrders\[orderId\]\s+)'
new_order_mapping = r'{filteredOrderCards.map((o)=> {\n            const orderId = o.order.id\n            '
content = re.sub(old_order_mapping, new_order_mapping, content)

# Find and replace order card opening
old_order_card_start = """              <div 
                key={orderId}
                style={{ 
                  minWidth:320,
                  maxWidth:320,
                  background:'white', 
                  borderRadius:20, 
                  border:'1px solid #e0e0e0',
                  overflow:'hidden',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                  transition:'all 0.2s'
                }}
              >
                {/* Nivel 1: Resumen del pedido */}
                <button 
                  onClick={() => toggleOrder(orderId)}"""

new_order_card_start = """              <div 
                key={orderId}
                onClick={() => setOrderModal(o)}
                style={{ 
                  minWidth:320,
                  maxWidth:320,
                  background:'white', 
                  borderRadius:20, 
                  border:'1px solid #e0e0e0',
                  overflow:'hidden',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                  transition:'all 0.2s',
                  cursor:'pointer'
                }}
              >
                {/* Resumen del pedido */}
                <div"""

content = content.replace(old_order_card_start, new_order_card_start)

# Replace button style to div style for order
content = content.replace(
    """                  style={{ 
                    width:'100%', 
                    padding:'24px', 
                    background:'none', 
                    border:'none', 
                    textAlign:'left', 
                    cursor:'pointer',
                    display:'block'
                  }}
                >""",
    """                  style={{ 
                    width:'100%', 
                    padding:'24px'
                  }}
                >""",
    1  # Replace first occurrence only
)

# Replace closing button to div and remove expanded content for orders
# Find the end of profit section and replace </button> with </div></div>
order_profit_end = """                        <div style={{ fontSize:11, opacity:0.6 }}>{o.profit_pct.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Nivel 2: Clientes */}
                {isExpanded && o.customers && ("""

order_profit_end_new = """                        <div style={{ fontSize:11, opacity:0.6 }}>{o.profit_pct.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>"""

content = content.replace(order_profit_end, order_profit_end_new)

# Find where "Por Cliente" section starts and clean up before it
# Look for the pattern before "Resumen por Cliente"
pattern_before_customers = r'\)\s+\}\)\s+\}\)\s+\}\)\s+\</div\>\s+\)\s+\}\)\}\)\s+\</div\>\s+\)\s+\}\}\)\}\s+\</div\>\s+\)\s+\}\}\)\}\s+\</div\>\s+\<\/div\>'
# This is too complex, let's use a simpler marker

# Write back
with open('src/pages/ContabilidadNew.jsx', 'w') as f:
    f.write(content)

print("File updated successfully!")

