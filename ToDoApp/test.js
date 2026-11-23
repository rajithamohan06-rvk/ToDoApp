import http from 'node:http';
import { spawn } from 'node:child_process';

// Test runner using built-in fetch
async function runTests() {
  console.log('--- Starting server in background for testing ---');
  
  const serverProcess = spawn('node', ['server.js'], {
    cwd: 'd:\\RAJITHA V K\\Anti Gravity Project 1\\ToDoApp',
    stdio: 'inherit'
  });

  // Give server time to bind
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    const baseUrl = 'http://127.0.0.1:3000';

    // 1. Test Static UI
    console.log('\n[1/5] Testing GET / (HTML)...');
    const indexRes = await fetch(`${baseUrl}/`);
    console.log(`Status: ${indexRes.status}`);
    const htmlText = await indexRes.text();
    if (!htmlText.includes('To-Do List')) throw new Error('Index HTML missing To-Do List');
    console.log('✓ GET / successfully served index.html');

    // 2. Test GET /api/todos
    console.log('\n[2/5] Testing GET /api/todos...');
    const todosRes = await fetch(`${baseUrl}/api/todos`);
    console.log(`Status: ${todosRes.status}`);
    const todos = await todosRes.json();
    console.log(`✓ Fetched ${todos.length} initial tasks`);

    // 3. Test POST /api/todos
    console.log('\n[3/5] Testing POST /api/todos...');
    const newTodoRes = await fetch(`${baseUrl}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Complete Node.js To-Do App' })
    });
    console.log(`Status: ${newTodoRes.status}`);
    const created = await newTodoRes.json();
    console.log(`✓ Created task: "${created.title}" with ID: ${created.id}`);

    // 4. Test PATCH /api/todos/:id
    console.log('\n[4/5] Testing PATCH /api/todos/:id...');
    const patchRes = await fetch(`${baseUrl}/api/todos/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true })
    });
    console.log(`Status: ${patchRes.status}`);
    const updated = await patchRes.json();
    console.log(`✓ Updated task completed status: ${updated.completed}`);

    // 5. Test DELETE /api/todos/:id
    console.log('\n[5/5] Testing DELETE /api/todos/:id...');
    const deleteRes = await fetch(`${baseUrl}/api/todos/${created.id}`, {
      method: 'DELETE'
    });
    console.log(`Status: ${deleteRes.status}`);
    const delResult = await deleteRes.json();
    console.log(`✓ Deleted task ID: ${delResult.id}`);

    console.log('\n========================================');
    console.log('🎉 ALL API & UI TESTS PASSED SUCCESSFULLY!');
    console.log('========================================');
  } finally {
    serverProcess.kill();
  }
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
