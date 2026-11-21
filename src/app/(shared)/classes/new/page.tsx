"use client";
import { ClassForm } from "@/components/ClassForm";
import { PageHeader } from "@/components/ui";

export default function NewClassPage() {
  return (
    <>
      <PageHeader title="Schedule a class" subtitle="Pick a time, choose families, and we'll send the invitations." />
      <ClassForm />
    </>
  );
}
