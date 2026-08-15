const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const express = require('express');
const cors = require('cors');
const path = require('path');

async function runTests() {
  console.log('🧪 Starting Full-Stack Application Verification Suite...\n');

  // Connect DB
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/contacts', require('./routes/contactRoutes'));
  app.use(require('./middleware/errorHandler'));

  const server = app.listen(5099);
  console.log('🚀 Test server running on port 5099');

  const makeRequest = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: 5099,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: rawData });
          }
        });
      });

      req.on('error', (err) => reject(err));

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  try {
    let token = null;
    let contactId = null;

    // Test 1: User Registration
    console.log('🔹 1. Testing User Registration (POST /api/auth/register)...');
    const testEmail = `priyanka_${Date.now()}@example.com`;
    const regRes = await makeRequest('POST', '/auth/register', {
      name: 'Priyanka Patel',
      email: testEmail,
      password: 'SecurePassword123!',
    });

    console.log(`   Status: ${regRes.status}`, regRes.data.message);
    if (regRes.status !== 201 || !regRes.data.token) {
      throw new Error('Registration failed');
    }
    console.log('   ✅ Registration successful. JWT Token received.\n');

    // Test 2: User Login
    console.log('🔹 2. Testing User Login (POST /api/auth/login)...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'SecurePassword123!',
    });

    console.log(`   Status: ${loginRes.status}`, loginRes.data.message);
    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error('Login failed');
    }
    token = loginRes.data.token;
    console.log('   ✅ Login successful. User authenticated.\n');

    // Test 3: Get Authenticated User Profile
    console.log('🔹 3. Testing Get Authenticated Profile (GET /api/auth/me)...');
    const meRes = await makeRequest('GET', '/auth/me', null, token);
    console.log(`   Status: ${meRes.status}`, meRes.data.user?.name);
    if (meRes.status !== 200 || meRes.data.user?.email !== testEmail) {
      throw new Error('Get profile failed');
    }
    console.log('   ✅ Profile fetched successfully.\n');

    // Test 4: Create Contact
    console.log('🔹 4. Testing Create Contact (POST /api/contacts)...');
    const createRes = await makeRequest(
      'POST',
      '/contacts',
      {
        name: 'Alex Johnson',
        email: 'alex.j@company.com',
        phone: '+1 555-0199',
        category: 'Work',
        company: 'Google DeepMind',
        address: 'San Francisco, CA',
        notes: 'Senior Engineering Partner',
        isFavorite: true,
      },
      token
    );

    console.log(`   Status: ${createRes.status}`, createRes.data.message);
    if (createRes.status !== 201 || !createRes.data.data?._id) {
      throw new Error('Contact creation failed');
    }
    contactId = createRes.data.data._id;
    console.log(`   ✅ Created contact with ID: ${contactId}\n`);

    // Test 5: Create a second contact
    console.log('🔹 5. Testing Create Second Contact (Personal)...');
    await makeRequest(
      'POST',
      '/contacts',
      {
        name: 'Emma Watson',
        email: 'emma@family.org',
        phone: '+1 555-0144',
        category: 'Family',
        isFavorite: false,
      },
      token
    );
    console.log('   ✅ Second contact created.\n');

    // Test 6: Get All Contacts & Search
    console.log('🔹 6. Testing Search & Filter (GET /api/contacts?q=Alex)...');
    const searchRes = await makeRequest('GET', '/contacts?q=Alex', null, token);
    console.log(`   Status: ${searchRes.status}, Found: ${searchRes.data.count}`);
    if (searchRes.status !== 200 || searchRes.data.count < 1) {
      throw new Error('Contact search failed');
    }
    console.log('   ✅ Search returned matched contact.\n');

    // Test 7: Get Stats Summary
    console.log('🔹 7. Testing Summary Stats (GET /api/contacts/stats/summary)...');
    const statsRes = await makeRequest('GET', '/contacts/stats/summary', null, token);
    console.log(`   Status: ${statsRes.status}`, statsRes.data.data);
    if (statsRes.status !== 200 || statsRes.data.data.total !== 2) {
      throw new Error('Stats summary failed');
    }
    console.log('   ✅ Statistics summary accurate.\n');

    // Test 8: Toggle Favorite
    console.log(`🔹 8. Testing Favorite Toggle (PATCH /api/contacts/${contactId}/favorite)...`);
    const favRes = await makeRequest('PATCH', `/contacts/${contactId}/favorite`, null, token);
    console.log(`   Status: ${favRes.status}`, favRes.data.message, `isFavorite=${favRes.data.data.isFavorite}`);
    if (favRes.status !== 200) {
      throw new Error('Toggle favorite failed');
    }
    console.log('   ✅ Favorite toggled successfully.\n');

    // Test 9: Update Contact
    console.log(`🔹 9. Testing Update Contact (PUT /api/contacts/${contactId})...`);
    const updateRes = await makeRequest(
      'PUT',
      `/contacts/${contactId}`,
      {
        notes: 'Updated note: Promoted to Staff Lead',
      },
      token
    );
    console.log(`   Status: ${updateRes.status}`, updateRes.data.data?.notes);
    if (updateRes.status !== 200 || !updateRes.data.data.notes.includes('Staff Lead')) {
      throw new Error('Update contact failed');
    }
    console.log('   ✅ Contact updated successfully.\n');

    // Test 10: Delete Contact
    console.log(`🔹 10. Testing Delete Contact (DELETE /api/contacts/${contactId})...`);
    const delRes = await makeRequest('DELETE', `/contacts/${contactId}`, null, token);
    console.log(`   Status: ${delRes.status}`, delRes.data.message);
    if (delRes.status !== 200) {
      throw new Error('Delete contact failed');
    }
    console.log('   ✅ Contact deleted successfully.\n');

    console.log('🎉 ALL 10 TEST CASES PASSED SUCCESSFULLY!');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test Suite Failed:', error);
    server.close();
    process.exit(1);
  }
}

runTests();
