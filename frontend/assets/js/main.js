const API_BASE = '/api';

let currentAdmin = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return ch;
    }
  });
}

function showAlert(el, message, type = 'danger') {
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.classList.remove('d-none');
}

function hideAlert(el) {
  if (!el) return;
  el.classList.add('d-none');
}

async function apiFetch(path, { method = 'GET', body, headers, ...rest } = {}) {
  const opts = {
    method,
    credentials: 'include',
    headers: { ...(headers ?? {}) },
    ...rest
  };

  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 204) {
    if (!res.ok) {
      const err = new Error(res.statusText);
      err.status = res.status;
      throw err;
    }
    return null;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function fetchMe() {
  const me = await apiFetch('/auth/me');
  currentAdmin = me;
  return me;
}

async function requireAuth() {
  try {
    await fetchMe();
    return true;
  } catch (err) {
    if (err.status === 401) {
      window.location.href = '/pages/login.html';
      return false;
    }
    throw err;
  }
}

function navbarHtml(active) {
  const isActive = (key) => (active === key ? 'active' : '');

  return `
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
      <a class="navbar-brand" href="/pages/dashboard.html">Student AMS</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#samNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="samNav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link ${isActive('dashboard')}" href="/pages/dashboard.html">Dashboard</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('students')}" href="/pages/students.html">Students</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('subjects')}" href="/pages/subjects.html">Subjects</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('teachers')}" href="/pages/teachers.html">Teachers</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('marks')}" href="/pages/marks.html">Marks</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('report')}" href="/pages/report.html">Reports</a></li>
        </ul>
        <div class="d-flex gap-2 align-items-center">
          <div class="text-white-50 small d-none d-lg-block" id="navAdmin"></div>
          <button class="btn btn-outline-light btn-sm" id="logoutBtn" type="button">Logout</button>
        </div>
      </div>
    </div>
  </nav>
  `;
}

function injectNavbar(active) {
  const host = document.getElementById('navbar');
  if (!host) return;
  host.innerHTML = navbarHtml(active);

  const adminEl = document.getElementById('navAdmin');
  if (adminEl && currentAdmin?.username) {
    adminEl.textContent = `Logged in as: ${currentAdmin.username}`;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } finally {
        window.location.href = '/pages/login.html';
      }
    });
  }
}

function renderEmptyRow(tbody, message, colSpan) {
  tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-muted py-4">${escapeHtml(
    message
  )}</td></tr>`;
}

async function initIndex() {
  try {
    await fetchMe();
    window.location.href = '/pages/dashboard.html';
  } catch (err) {
    window.location.href = '/pages/login.html';
  }
}

async function initLogin() {
  const alertEl = document.getElementById('loginAlert');
  const form = document.getElementById('loginForm');
  const btn = form?.querySelector('button[type="submit"]');

  try {
    await fetchMe();
    window.location.href = '/pages/dashboard.html';
    return;
  } catch (err) {
    if (err.status !== 401) {
      showAlert(alertEl, err.message || 'Failed to load', 'danger');
    }
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alertEl);

    const username = document.getElementById('username')?.value ?? '';
    const password = document.getElementById('password')?.value ?? '';
    if (btn) btn.disabled = true;

    try {
      await apiFetch('/auth/login', { method: 'POST', body: { username, password } });
      window.location.href = '/pages/dashboard.html';
    } catch (err) {
      showAlert(alertEl, err.message || 'Login failed', 'danger');
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

async function initDashboard() {
  injectNavbar('dashboard');
  const adminLabel = document.getElementById('adminLabel');
  if (adminLabel && currentAdmin?.username) {
    adminLabel.textContent = `Logged in as: ${currentAdmin.username}`;
  }
}

async function initStudents() {
  injectNavbar('students');

  const alertEl = document.getElementById('studentAlert');
  const tbody = document.getElementById('studentsTbody');
  const addBtn = document.getElementById('addStudentBtn');

  const modalEl = document.getElementById('studentModal');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;

  const modalTitle = document.getElementById('studentModalTitle');
  const form = document.getElementById('studentForm');
  const modalAlert = document.getElementById('studentModalAlert');

  const inputId = document.getElementById('studentId');
  const inputName = document.getElementById('studentName');
  const inputGender = document.getElementById('studentGender');
  const inputGrade = document.getElementById('studentGrade');
  const inputYear = document.getElementById('academicYear');
  const inputSemester = document.getElementById('semester');

  let cache = [];

  function openModal(student) {
    hideAlert(modalAlert);
    if (student) {
      modalTitle.textContent = 'Edit Student';
      inputId.value = student.student_id;
      inputName.value = student.student_name;
      inputGender.value = student.gender;
      inputGrade.value = student.grade;
      inputYear.value = student.academic_year;
      inputSemester.value = student.semester;
    } else {
      modalTitle.textContent = 'Add Student';
      inputId.value = '';
      inputName.value = '';
      inputGender.value = '';
      inputGrade.value = '';
      inputYear.value = '';
      inputSemester.value = '';
    }
    modal?.show();
  }

  function renderRows(rows) {
    if (!tbody) return;
    if (!rows.length) return renderEmptyRow(tbody, 'No students found.', 7);

    tbody.innerHTML = rows
      .map(
        (s) => `
      <tr>
        <td>${escapeHtml(s.student_id)}</td>
        <td>${escapeHtml(s.student_name)}</td>
        <td>${escapeHtml(s.gender)}</td>
        <td>${escapeHtml(s.grade)}</td>
        <td>${escapeHtml(s.academic_year)}</td>
        <td>${escapeHtml(s.semester)}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${escapeHtml(
              s.student_id
            )}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${escapeHtml(
              s.student_id
            )}">Delete</button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  async function load() {
    hideAlert(alertEl);
    const students = await apiFetch('/students');
    cache = students;
    renderRows(students);
  }

  addBtn?.addEventListener('click', () => openModal(null));

  tbody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const student = cache.find((x) => x.student_id === id);

    if (action === 'edit' && student) {
      openModal(student);
      return;
    }

    if (action === 'delete') {
      const ok = window.confirm('Delete this student? Marks will also be deleted.');
      if (!ok) return;

      try {
        await apiFetch(`/students/${id}`, { method: 'DELETE' });
        await load();
        showAlert(alertEl, 'Student deleted.', 'success');
      } catch (err) {
        showAlert(alertEl, err.message || 'Delete failed', 'danger');
      }
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(modalAlert);

    const id = inputId.value ? Number(inputId.value) : null;
    const payload = {
      student_name: inputName.value,
      gender: inputGender.value,
      grade: inputGrade.value,
      academic_year: inputYear.value,
      semester: inputSemester.value
    };

    try {
      if (id) {
        await apiFetch(`/students/${id}`, { method: 'PUT', body: payload });
        showAlert(alertEl, 'Student updated.', 'success');
      } else {
        await apiFetch('/students', { method: 'POST', body: payload });
        showAlert(alertEl, 'Student created.', 'success');
      }

      modal?.hide();
      await load();
    } catch (err) {
      showAlert(modalAlert, err.message || 'Save failed', 'danger');
    }
  });

  try {
    await load();
  } catch (err) {
    showAlert(alertEl, err.message || 'Failed to load students', 'danger');
  }
}

async function initSubjects() {
  injectNavbar('subjects');

  const deptAlert = document.getElementById('deptAlert');
  const deptTbody = document.getElementById('departmentsTbody');
  const deptForm = document.getElementById('deptForm');
  const deptName = document.getElementById('deptName');

  const subjectAlert = document.getElementById('subjectAlert');
  const subjectsTbody = document.getElementById('subjectsTbody');
  const addSubjectBtn = document.getElementById('addSubjectBtn');

  const modalEl = document.getElementById('subjectModal');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const modalTitle = document.getElementById('subjectModalTitle');
  const form = document.getElementById('subjectForm');
  const modalAlert = document.getElementById('subjectModalAlert');

  const inputId = document.getElementById('subjectId');
  const inputName = document.getElementById('subjectName');
  const inputDept = document.getElementById('subjectDepartment');
  const inputTeacher = document.getElementById('subjectTeacher');
  const inputTotal = document.getElementById('subjectTotalMark');

  let departments = [];
  let teachers = [];
  let subjects = [];

  function renderDepartments() {
    if (!deptTbody) return;
    if (!departments.length) return renderEmptyRow(deptTbody, 'No departments yet.', 2);
    deptTbody.innerHTML = departments
      .map(
        (d) => `
      <tr>
        <td>${escapeHtml(d.department_id)}</td>
        <td>${escapeHtml(d.department_name)}</td>
      </tr>`
      )
      .join('');
  }

  function fillSelect(selectEl, items, { includeNoneLabel } = {}) {
    if (!selectEl) return;
    const current = selectEl.value;

    const options = [];
    if (includeNoneLabel) options.push(`<option value="">${escapeHtml(includeNoneLabel)}</option>`);

    for (const item of items) {
      options.push(
        `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`
      );
    }

    selectEl.innerHTML = options.join('');
    if (current) selectEl.value = current;
  }

  function renderSubjects() {
    if (!subjectsTbody) return;
    if (!subjects.length) return renderEmptyRow(subjectsTbody, 'No subjects found.', 6);

    subjectsTbody.innerHTML = subjects
      .map((s) => {
        const deptName = s.department_name ?? '';
        const teacherName = s.teacher_name ?? '';
        return `
        <tr>
          <td>${escapeHtml(s.subject_id)}</td>
          <td>${escapeHtml(s.subject_name)}</td>
          <td>${escapeHtml(deptName)}</td>
          <td>${escapeHtml(teacherName)}</td>
          <td>${escapeHtml(s.total_mark)}</td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${escapeHtml(
                s.subject_id
              )}">Edit</button>
              <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${escapeHtml(
                s.subject_id
              )}">Delete</button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');
  }

  function openModal(subject) {
    hideAlert(modalAlert);
    inputTotal.value = '100';
    if (subject) {
      modalTitle.textContent = 'Edit Subject';
      inputId.value = subject.subject_id;
      inputName.value = subject.subject_name;
      inputDept.value = subject.department_id ?? '';
      inputTeacher.value = subject.teacher_id ?? '';
    } else {
      modalTitle.textContent = 'Add Subject';
      inputId.value = '';
      inputName.value = '';
      inputDept.value = '';
      inputTeacher.value = '';
    }
    modal?.show();
  }

  async function loadAll() {
    hideAlert(deptAlert);
    hideAlert(subjectAlert);

    [departments, teachers, subjects] = await Promise.all([
      apiFetch('/departments'),
      apiFetch('/teachers'),
      apiFetch('/subjects')
    ]);

    renderDepartments();

    fillSelect(
      inputDept,
      departments.map((d) => ({ id: d.department_id, label: d.department_name })),
      { includeNoneLabel: '(None)' }
    );
    fillSelect(
      inputTeacher,
      teachers.map((t) => ({ id: t.teacher_id, label: t.teacher_name })),
      { includeNoneLabel: '(Unassigned)' }
    );
    renderSubjects();
  }

  deptForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(deptAlert);
    try {
      await apiFetch('/departments', { method: 'POST', body: { department_name: deptName.value } });
      deptName.value = '';
      await loadAll();
      showAlert(deptAlert, 'Department added.', 'success');
    } catch (err) {
      showAlert(deptAlert, err.message || 'Failed to add department', 'danger');
    }
  });

  addSubjectBtn?.addEventListener('click', () => openModal(null));

  subjectsTbody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);
    const subject = subjects.find((x) => x.subject_id === id);

    if (action === 'edit' && subject) {
      openModal(subject);
      return;
    }

    if (action === 'delete') {
      const ok = window.confirm('Delete this subject? Marks for this subject will also be deleted.');
      if (!ok) return;

      try {
        await apiFetch(`/subjects/${id}`, { method: 'DELETE' });
        await loadAll();
        showAlert(subjectAlert, 'Subject deleted.', 'success');
      } catch (err) {
        showAlert(subjectAlert, err.message || 'Delete failed', 'danger');
      }
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(modalAlert);

    const id = inputId.value ? Number(inputId.value) : null;
    const payload = {
      subject_name: inputName.value,
      department_id: inputDept.value || null,
      teacher_id: inputTeacher.value || null,
      total_mark: 100
    };

    try {
      if (id) {
        await apiFetch(`/subjects/${id}`, { method: 'PUT', body: payload });
        showAlert(subjectAlert, 'Subject updated.', 'success');
      } else {
        await apiFetch('/subjects', { method: 'POST', body: payload });
        showAlert(subjectAlert, 'Subject created.', 'success');
      }

      modal?.hide();
      await loadAll();
    } catch (err) {
      showAlert(modalAlert, err.message || 'Save failed', 'danger');
    }
  });

  try {
    await loadAll();
  } catch (err) {
    showAlert(subjectAlert, err.message || 'Failed to load subjects', 'danger');
  }
}

async function initTeachers() {
  injectNavbar('teachers');

  const alertEl = document.getElementById('teacherAlert');
  const tbody = document.getElementById('teachersTbody');
  const addBtn = document.getElementById('addTeacherBtn');

  const modalEl = document.getElementById('teacherModal');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;

  const modalTitle = document.getElementById('teacherModalTitle');
  const form = document.getElementById('teacherForm');
  const modalAlert = document.getElementById('teacherModalAlert');

  const inputId = document.getElementById('teacherId');
  const inputName = document.getElementById('teacherName');
  const inputDept = document.getElementById('teacherDepartment');
  const inputRole = document.getElementById('teacherRole');
  const inputClass = document.getElementById('assignedClass');

  let departments = [];
  let teachers = [];

  function fillDeptSelect() {
    if (!inputDept) return;
    const current = inputDept.value;
    const options = ['<option value="">(None)</option>'];
    for (const d of departments) {
      options.push(
        `<option value="${escapeHtml(d.department_id)}">${escapeHtml(d.department_name)}</option>`
      );
    }
    inputDept.innerHTML = options.join('');
    if (current) inputDept.value = current;
  }

  function renderRows(rows) {
    if (!tbody) return;
    if (!rows.length) return renderEmptyRow(tbody, 'No teachers found.', 6);

    tbody.innerHTML = rows
      .map(
        (t) => `
      <tr>
        <td>${escapeHtml(t.teacher_id)}</td>
        <td>${escapeHtml(t.teacher_name)}</td>
        <td>${escapeHtml(t.department_name ?? '')}</td>
        <td>${escapeHtml(t.assigned_class ?? '')}</td>
        <td>${escapeHtml(t.role)}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${escapeHtml(
              t.teacher_id
            )}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${escapeHtml(
              t.teacher_id
            )}">Delete</button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  function openModal(teacher) {
    hideAlert(modalAlert);
    if (teacher) {
      modalTitle.textContent = 'Edit Teacher';
      inputId.value = teacher.teacher_id;
      inputName.value = teacher.teacher_name;
      inputDept.value = teacher.department_id ?? '';
      inputRole.value = teacher.role;
      inputClass.value = teacher.assigned_class ?? '';
    } else {
      modalTitle.textContent = 'Add Teacher';
      inputId.value = '';
      inputName.value = '';
      inputDept.value = '';
      inputRole.value = 'Subject Teacher';
      inputClass.value = '';
    }
    modal?.show();
  }

  async function load() {
    hideAlert(alertEl);
    [departments, teachers] = await Promise.all([apiFetch('/departments'), apiFetch('/teachers')]);
    fillDeptSelect();
    renderRows(teachers);
  }

  addBtn?.addEventListener('click', () => openModal(null));

  tbody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const teacher = teachers.find((x) => x.teacher_id === id);

    if (action === 'edit' && teacher) {
      openModal(teacher);
      return;
    }

    if (action === 'delete') {
      const ok = window.confirm('Delete this teacher? Subjects will be unassigned.');
      if (!ok) return;

      try {
        await apiFetch(`/teachers/${id}`, { method: 'DELETE' });
        await load();
        showAlert(alertEl, 'Teacher deleted.', 'success');
      } catch (err) {
        showAlert(alertEl, err.message || 'Delete failed', 'danger');
      }
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(modalAlert);

    const id = inputId.value ? Number(inputId.value) : null;
    const payload = {
      teacher_name: inputName.value,
      department_id: inputDept.value || null,
      role: inputRole.value,
      assigned_class: inputClass.value
    };

    try {
      if (id) {
        await apiFetch(`/teachers/${id}`, { method: 'PUT', body: payload });
        showAlert(alertEl, 'Teacher updated.', 'success');
      } else {
        await apiFetch('/teachers', { method: 'POST', body: payload });
        showAlert(alertEl, 'Teacher created.', 'success');
      }

      modal?.hide();
      await load();
    } catch (err) {
      showAlert(modalAlert, err.message || 'Save failed', 'danger');
    }
  });

  try {
    await load();
  } catch (err) {
    showAlert(alertEl, err.message || 'Failed to load teachers', 'danger');
  }
}

async function initMarks() {
  injectNavbar('marks');

  const alertEl = document.getElementById('marksAlert');
  const studentSelect = document.getElementById('markStudentSelect');
  const tbody = document.getElementById('marksTbody');
  const saveBtn = document.getElementById('saveMarksBtn');
  const reloadBtn = document.getElementById('reloadMarksBtn');

  let students = [];
  let subjects = [];
  let currentStudentId = null;
  let markMap = new Map();

  function fillStudents() {
    if (!studentSelect) return;
    const options = ['<option value="">Select...</option>'];
    for (const s of students) {
      options.push(
        `<option value="${escapeHtml(s.student_id)}">${escapeHtml(
          `${s.student_name} (ID: ${s.student_id})`
        )}</option>`
      );
    }
    studentSelect.innerHTML = options.join('');
  }

  function renderTable() {
    if (!tbody) return;
    if (!currentStudentId) {
      return renderEmptyRow(tbody, 'Select a student to enter marks.', 4);
    }
    if (!subjects.length) {
      return renderEmptyRow(tbody, 'No subjects available. Add subjects first.', 4);
    }

    tbody.innerHTML = subjects
      .map((sub) => {
        const value = markMap.has(sub.subject_id) ? String(markMap.get(sub.subject_id)) : '';
        const status = value === '' ? '-' : Number(value) >= 50 ? 'PASS' : 'FAIL';
        const statusClass =
          status === 'PASS' ? 'text-success' : status === 'FAIL' ? 'text-danger' : 'text-muted';
        return `
        <tr>
          <td>${escapeHtml(sub.subject_id)}</td>
          <td>${escapeHtml(sub.subject_name)}</td>
          <td>
            <input
              type="number"
              class="form-control form-control-sm mark-input"
              data-subject-id="${escapeHtml(sub.subject_id)}"
              min="0"
              max="100"
              step="1"
              value="${escapeHtml(value)}"
              placeholder="0-100"
              required
            />
          </td>
          <td class="${statusClass} fw-semibold" data-status-for="${escapeHtml(
            sub.subject_id
          )}">${escapeHtml(status)}</td>
        </tr>
      `;
      })
      .join('');
  }

  async function loadInitial() {
    hideAlert(alertEl);
    [students, subjects] = await Promise.all([apiFetch('/students'), apiFetch('/subjects')]);
    fillStudents();
  }

  async function loadMarks(studentId) {
    hideAlert(alertEl);
    const marks = await apiFetch(`/marks?student_id=${encodeURIComponent(studentId)}`);
    markMap = new Map(marks.map((m) => [m.subject_id, m.mark]));
    renderTable();
  }

  studentSelect?.addEventListener('change', async () => {
    const value = studentSelect.value;
    currentStudentId = value ? Number(value) : null;

    saveBtn.disabled = !currentStudentId;
    reloadBtn.disabled = !currentStudentId;

    if (!currentStudentId) {
      renderTable();
      return;
    }

    try {
      await loadMarks(currentStudentId);
    } catch (err) {
      showAlert(alertEl, err.message || 'Failed to load marks', 'danger');
    }
  });

  tbody?.addEventListener('input', (e) => {
    const input = e.target.closest('input.mark-input');
    if (!input) return;

    const subjectId = Number(input.dataset.subjectId);
    const value = input.value;
    const statusEl = tbody.querySelector(`[data-status-for="${CSS.escape(String(subjectId))}"]`);

    if (!statusEl) return;

    if (value === '') {
      statusEl.textContent = '-';
      statusEl.className = 'text-muted fw-semibold';
      return;
    }

    const num = Number(value);
    if (!Number.isFinite(num) || num < 0 || num > 100) {
      statusEl.textContent = 'Invalid';
      statusEl.className = 'text-warning fw-semibold';
      return;
    }

    if (num >= 50) {
      statusEl.textContent = 'PASS';
      statusEl.className = 'text-success fw-semibold';
    } else {
      statusEl.textContent = 'FAIL';
      statusEl.className = 'text-danger fw-semibold';
    }
  });

  async function saveMarks() {
    hideAlert(alertEl);
    if (!currentStudentId) return;

    const inputs = Array.from(tbody.querySelectorAll('input.mark-input'));
    if (inputs.length === 0) return;

    const payloadMarks = [];
    for (const input of inputs) {
      const subjectId = Number(input.dataset.subjectId);
      const raw = input.value;
      if (raw === '') {
        showAlert(alertEl, 'Enter marks for all subjects before saving.', 'warning');
        return;
      }
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        showAlert(alertEl, 'Marks must be between 0 and 100.', 'warning');
        return;
      }
      payloadMarks.push({ subject_id: subjectId, mark: Math.trunc(value) });
    }

    saveBtn.disabled = true;
    reloadBtn.disabled = true;
    try {
      await apiFetch('/marks/bulk', {
        method: 'POST',
        body: { student_id: currentStudentId, marks: payloadMarks }
      });
      await loadMarks(currentStudentId);
      showAlert(alertEl, 'Marks saved.', 'success');
    } catch (err) {
      showAlert(alertEl, err.message || 'Save failed', 'danger');
    } finally {
      saveBtn.disabled = !currentStudentId;
      reloadBtn.disabled = !currentStudentId;
    }
  }

  saveBtn?.addEventListener('click', saveMarks);
  reloadBtn?.addEventListener('click', async () => {
    if (!currentStudentId) return;
    try {
      await loadMarks(currentStudentId);
      showAlert(alertEl, 'Marks reloaded.', 'success');
    } catch (err) {
      showAlert(alertEl, err.message || 'Failed to reload marks', 'danger');
    }
  });

  try {
    await loadInitial();
    renderTable();
  } catch (err) {
    showAlert(alertEl, err.message || 'Failed to load data', 'danger');
  }
}

async function initReport() {
  injectNavbar('report');

  const alertEl = document.getElementById('reportAlert');
  const refreshBtn = document.getElementById('refreshReportsBtn');
  const summaryTbody = document.getElementById('reportSummaryTbody');
  const studentSelect = document.getElementById('reportStudentSelect');
  const printBtn = document.getElementById('printBtn');

  const sheetArea = document.getElementById('sheetArea');
  const sheetPlaceholder = document.getElementById('sheetPlaceholder');
  const sheetHeader = document.getElementById('sheetHeader');
  const sheetMarksTbody = document.getElementById('sheetMarksTbody');
  const sheetTotalCell = document.getElementById('sheetTotalCell');
  const sheetAvgCell = document.getElementById('sheetAvgCell');
  const sheetRankCell = document.getElementById('sheetRankCell');
  const sheetStatusCell = document.getElementById('sheetStatusCell');

  let reports = [];

  function fillStudentSelect() {
    if (!studentSelect) return;
    const options = ['<option value="">Select...</option>'];
    for (const r of reports) {
      const st = r.student;
      options.push(
        `<option value="${escapeHtml(st.student_id)}">${escapeHtml(
          `${st.student_name} (ID: ${st.student_id})`
        )}</option>`
      );
    }
    studentSelect.innerHTML = options.join('');
  }

  function renderSummary() {
    if (!summaryTbody) return;
    if (!reports.length) return renderEmptyRow(summaryTbody, 'No students found.', 7);

    summaryTbody.innerHTML = reports
      .map((r) => {
        const statusClass = r.status === 'PASS' ? 'text-success' : 'text-danger';
        return `
        <tr>
          <td class="fw-semibold">${escapeHtml(r.rank)}</td>
          <td>${escapeHtml(r.student.student_id)}</td>
          <td>${escapeHtml(r.student.student_name)}</td>
          <td>${escapeHtml(r.total)}</td>
          <td>${escapeHtml(r.average)}</td>
          <td class="${statusClass} fw-semibold">${escapeHtml(r.status)}</td>
          <td><button class="btn btn-sm btn-outline-primary" data-action="view" data-id="${escapeHtml(
            r.student.student_id
          )}">View</button></td>
        </tr>
      `;
      })
      .join('');
  }

  function showSheet(report) {
    if (!report) return;
    sheetPlaceholder?.classList.add('d-none');
    sheetArea?.classList.remove('d-none');
    if (printBtn) printBtn.disabled = false;

    const st = report.student;
    if (sheetHeader) {
      sheetHeader.textContent = `Student: ${st.student_name} | ID: ${st.student_id} | Grade: ${st.grade} | Year: ${st.academic_year} | Semester: ${st.semester}`;
    }

    if (sheetMarksTbody) {
      sheetMarksTbody.innerHTML = report.subjectMarks
        .map((m) => {
          const mark = m.mark ?? null;
          const markText = mark === null ? '-' : String(mark);
          const result = mark === null ? '-' : mark >= 50 ? 'PASS' : 'FAIL';
          const cls =
            result === 'PASS'
              ? 'text-success'
              : result === 'FAIL'
                ? 'text-danger'
                : 'text-muted';
          return `
          <tr>
            <td>${escapeHtml(m.subject_name)}</td>
            <td class="fw-semibold">${escapeHtml(markText)}</td>
            <td class="${cls} fw-semibold">${escapeHtml(result)}</td>
          </tr>
        `;
        })
        .join('');
    }

    if (sheetTotalCell) sheetTotalCell.textContent = `${report.total} / ${report.total_out_of}`;
    if (sheetAvgCell) sheetAvgCell.textContent = String(report.average);
    if (sheetRankCell) sheetRankCell.textContent = String(report.rank);
    if (sheetStatusCell) {
      sheetStatusCell.textContent = report.status;
      sheetStatusCell.className =
        report.status === 'PASS' ? 'text-success fw-semibold' : 'text-danger fw-semibold';
    }
  }

  async function load() {
    hideAlert(alertEl);
    const data = await apiFetch('/reports');
    reports = data.reports ?? [];
    fillStudentSelect();
    renderSummary();

    if (!reports.length) {
      if (printBtn) printBtn.disabled = true;
      sheetArea?.classList.add('d-none');
      sheetPlaceholder?.classList.remove('d-none');
    }
  }

  refreshBtn?.addEventListener('click', async () => {
    try {
      await load();
      showAlert(alertEl, 'Reports refreshed.', 'success');
    } catch (err) {
      showAlert(alertEl, err.message || 'Failed to load reports', 'danger');
    }
  });

  summaryTbody?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="view"]');
    if (!btn) return;
    const studentId = Number(btn.dataset.id);
    if (studentSelect) {
      studentSelect.value = String(studentId);
      studentSelect.dispatchEvent(new Event('change'));
    }
  });

  studentSelect?.addEventListener('change', () => {
    const id = studentSelect.value ? Number(studentSelect.value) : null;
    if (!id) {
      if (printBtn) printBtn.disabled = true;
      sheetArea?.classList.add('d-none');
      sheetPlaceholder?.classList.remove('d-none');
      return;
    }
    const report = reports.find((r) => r.student.student_id === id);
    showSheet(report);
  });

  printBtn?.addEventListener('click', () => window.print());

  try {
    await load();
  } catch (err) {
    showAlert(alertEl, err.message || 'Failed to load reports', 'danger');
  }
}

async function boot() {
  const page = document.body?.dataset?.page;
  const needsAuth = document.body?.dataset?.requireAuth === 'true';

  if (needsAuth) {
    const ok = await requireAuth();
    if (!ok) return;
  }

  switch (page) {
    case 'index':
      await initIndex();
      break;
    case 'login':
      await initLogin();
      break;
    case 'dashboard':
      await initDashboard();
      break;
    case 'students':
      await initStudents();
      break;
    case 'subjects':
      await initSubjects();
      break;
    case 'teachers':
      await initTeachers();
      break;
    case 'marks':
      await initMarks();
      break;
    case 'report':
      await initReport();
      break;
    default:
      break;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  boot().catch((err) => {
    console.error(err);
  });
});
