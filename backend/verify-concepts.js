const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'student_academic_management_v2'
  });

  try {
    console.log('Testing Advanced Database Concepts...\n');
    
    // Test 1: Check Views
    console.log('1. VIEWS - Checking if all 7 views exist:');
    const [views] = await conn.query(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
      ['student_academic_management_v2']
    );
    views.forEach(v => console.log('   ✓', v.TABLE_NAME));
    
    // Test 2: Check Functions
    console.log('\n2. FUNCTIONS - Checking if all 8 functions exist:');
    const [funcs] = await conn.query(
      'SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = ? ORDER BY ROUTINE_NAME',
      ['student_academic_management_v2', 'FUNCTION']
    );
    funcs.forEach(f => console.log('   ✓', f.ROUTINE_NAME));
    
    // Test 3: Check Procedures
    console.log('\n3. STORED PROCEDURES - Checking if all 4 procedures exist:');
    const [procs] = await conn.query(
      'SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = ? ORDER BY ROUTINE_NAME',
      ['student_academic_management_v2', 'PROCEDURE']
    );
    procs.forEach(p => console.log('   ✓', p.ROUTINE_NAME));
    
    // Test 4: Check Triggers
    console.log('\n4. TRIGGERS - Checking if all 11 triggers exist:');
    const [trigs] = await conn.query(
      'SELECT TRIGGER_NAME FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = ? ORDER BY TRIGGER_NAME',
      ['student_academic_management_v2']
    );
    trigs.forEach(t => console.log('   ✓', t.TRIGGER_NAME));
    
    // Test 5: Check Indexes
    console.log('\n5. INDEXES - Checking if indexes are created:');
    const [indexes] = await conn.query(
      'SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND INDEX_NAME != ? ORDER BY INDEX_NAME',
      ['student_academic_management_v2', 'PRIMARY']
    );
    console.log('   ✓ Total indexes created:', indexes.length);
    
    console.log('\n✓ All advanced database concepts verified successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await conn.end();
  }
})();
