// src/app/test-dept-subject/page.js
"use client";

import { useState, useEffect } from "react";
import { getDeptSubjectDashboard } from "@/services/deptHeadDashboard"; // Import service ของเรา
import { Spin, message } from "antd";

export default function TestPage() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // *** Hardcode ID ที่เราต้องการทดสอบ ***
  // ให้คุณ Copy subjectid จาก URL ที่ไม่ทำงาน มาวางตรงนี้
  const testSubjectId = 'f870814b-cf5f-44f7-ad12-d85f7ddb765d'; // <<<<==== แก้ไข ID ตรงนี้

  useEffect(() => {
    const fetchData = async () => {
      console.log(`--- TEST PAGE: Fetching data for subject ID: ${testSubjectId} ---`);
      setLoading(true);

      const res = await getDeptSubjectDashboard(testSubjectId);

      console.log("--- TEST PAGE: API Response ---", res);

      if (res.success && res.data) {
        setDetails(res.data);
      } else {
        message.error("Fetch failed: " + (res.error || "No data"));
        setDetails(null);
      }
      setLoading(false);
    };

    fetchData();
  }, []); // ทำงานแค่ครั้งเดียว

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}><Spin size="large" /> <p>Loading test page...</p></div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Test Page for Subject Dashboard</h1>
      <hr />

      <h2>API Call Result:</h2>
      {details ? (
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(details, null, 2)}
        </pre>
      ) : (
        <p style={{ color: 'red' }}>Failed to fetch details or no data found.</p>
      )}

      <hr />

      <h2>Rendered Data:</h2>
      {details ? (
        <div>
          <h3>Subject Info:</h3>
          <ul>
            <li>Code: {details.subject_info?.subject_code}</li>
            <li>Name: {details.subject_info?.subject_name}</li>
            <li>Student Count: {details.subject_info?.student_count}</li>
          </ul>
          <h3>Assignments Summary:</h3>
          <ul>
            <li>Total: {details.assignments_summary?.total_assignments}</li>
            <li>Individual: {details.assignments_summary?.individual_count}</li>
            <li>Group: {details.assignments_summary?.group_count}</li>
          </ul>
          <h3>Actual Hours: {details.actual_workload_hours}</h3>
        </div>
      ) : (
        <p>No data to render.</p>
      )}
    </div>
  );
}