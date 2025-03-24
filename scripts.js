const supabaseUrl = 'https://fktghbkijmtpcegwwlzz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdGdoYmtpam10cGNlZ3d3bHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1OTMwNTEsImV4cCI6MjA1ODE2OTA1MX0.FS9mfPFRK14H9oFu_OG9dVzanqvnP7H5QxfzwcCv_dY';
const supabase = createClient(supabaseUrl, supabaseKey);

function showMessage(message, isError = false) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = message;
  messageDiv.className = isError ? 'error' : 'success';
  messageDiv.style.display = 'block';
}

function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function sendEmail(email, code) {
  const response = await fetch('https://send.api.mailtrap.io/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_MAILTRAP_API_KEY',
    },
    body: JSON.stringify({
      from: { email: 'noreply@vgames.run.place' },
      to: [{ email }],
      subject: 'Your VGames Verification Code',
      text: `Your verification code is: ${code}`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }
}

async function isIpBlocked(ip) {
  const { data, error } = await supabase
    .from('blocked_ips')
    .select('*')
    .eq('ip', ip)
    .single();

  if (error || !data) return false;

  const blockedAt = new Date(data.blocked_at);
  const now = new Date();
  const daysPassed = (now - blockedAt) / (1000 * 60 * 60 * 24);

  if (daysPassed >= 3) {
    await supabase.from('blocked_ips').delete().eq('ip', ip);
    return false;
  }

  return data.attempts >= 3;
}

async function incrementIpAttempts(ip) {
  const { data, error } = await supabase
    .from('blocked_ips')
    .select('*')
    .eq('ip', ip)
    .single();

  if (error || !data) {
    await supabase.from('blocked_ips').insert([{ ip, blocked_at: new Date(), attempts: 1 }]);
  } else {
    await supabase
      .from('blocked_ips')
      .update({ attempts: data.attempts + 1 })
      .eq('ip', ip);
  }
}

async function getUserIp() {
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  return data.ip;
}

document.getElementById('registration-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const ip = await getUserIp();

  if (await isIpBlocked(ip)) {
    showMessage('Your IP is blocked due to multiple failed attempts. Please try again later.', true);
    return;
  }

  const name = document.getElementById('name').value;
  const surname = document.getElementById('surname').value;
  const username = document.getElementById('username').value;
  const birthdate = document.getElementById('birthdate').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const birthYear = new Date(birthdate).getFullYear();
  const currentYear = new Date().getFullYear();
  if (currentYear - birthYear < 14) {
    showMessage('You must be at least 14 years old to register.', true);
    return;
  }

  const code = generateUniqueCode();
  try {
    await sendEmail(email, code);
  } catch (error) {
    showMessage('Failed to send verification code. Please try again.', true);
    return;
  }

  const userCode = prompt('A verification code has been sent to your email. Please enter it here:');
  if (userCode !== code) {
    showMessage('Invalid verification code. Please try again.', true);
    await incrementIpAttempts(ip);
    return;
  }

  const { user, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        surname,
        username,
        birthdate,
      },
    },
  });

  if (error) {
    showMessage(`Error creating account: ${error.message}`, true);
    return;
  }

  const fileName = `${username}.txt`;
  const fileContent = `Name: ${name}\nSurname: ${surname}\nUsername: ${username}\nBirthdate: ${birthdate}\nEmail: ${email}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('user-files')
    .upload(fileName, new Blob([fileContent], { type: 'text/plain' }));

  if (uploadError) {
    showMessage(`Error creating account file: ${uploadError.message}`, true);
    return;
  }

  showMessage('Account created successfully!');
});
