"use client";

import { Skeleton, Card, Row, Col } from "antd";

// Loading skeleton สำหรับ Dashboard cards
export const DashboardCardSkeleton = ({ count = 4 }) => (
  <Row gutter={[24, 24]}>
    {Array.from({ length: count }).map((_, index) => (
      <Col xs={24} sm={12} lg={6} key={index}>
        <Card>
          <Skeleton.Avatar size="large" active />
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
      </Col>
    ))}
  </Row>
);

// Loading skeleton สำหรับ Table
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Card>
    <Skeleton.Input style={{ width: "200px", marginBottom: "16px" }} active />
    {Array.from({ length: rows }).map((_, index) => (
      <Row key={index} gutter={[16, 16]} style={{ marginBottom: "12px" }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Col span={24 / columns} key={colIndex}>
            <Skeleton.Input style={{ width: "100%" }} active />
          </Col>
        ))}
      </Row>
    ))}
  </Card>
);

// Loading skeleton สำหรับ Chart
export const ChartSkeleton = ({ height = 400 }) => (
  <Card>
    <Skeleton.Input style={{ width: "150px", marginBottom: "16px" }} active />
    <Skeleton.Avatar
      shape="square"
      style={{ width: "100%", height: `${height}px` }}
      active
    />
  </Card>
);

// Loading skeleton สำหรับ Form
export const FormSkeleton = ({ fields = 5 }) => (
  <Card>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} style={{ marginBottom: "24px" }}>
        <Skeleton.Input
          style={{ width: "100px", marginBottom: "8px" }}
          active
        />
        <Skeleton.Input style={{ width: "100%" }} active />
      </div>
    ))}
    <Skeleton.Button style={{ width: "100px" }} active />
  </Card>
);

// Loading skeleton สำหรับ Subject Cards
export const SubjectCardSkeleton = ({ count = 6 }) => (
  <Row gutter={[24, 24]}>
    {Array.from({ length: count }).map((_, index) => (
      <Col xs={24} md={12} lg={8} key={index}>
        <Card hoverable>
          <Skeleton.Input
            style={{ width: "80px", marginBottom: "8px" }}
            active
          />
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton.Button
            style={{ width: "120px", marginTop: "16px" }}
            active
          />
        </Card>
      </Col>
    ))}
  </Row>
);

// Loading skeleton สำหรับ Page
export const PageLoadingSkeleton = () => (
  <div style={{ padding: "24px" }}>
    <div style={{ marginBottom: "32px" }}>
      <Skeleton.Input style={{ width: "300px", height: "32px" }} active />
      <br />
      <Skeleton.Input style={{ width: "200px", marginTop: "8px" }} active />
    </div>
    <DashboardCardSkeleton />
    <div style={{ marginTop: "32px" }}>
      <ChartSkeleton />
    </div>
  </div>
);

export default {
  DashboardCardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  FormSkeleton,
  SubjectCardSkeleton,
  PageLoadingSkeleton,
};
