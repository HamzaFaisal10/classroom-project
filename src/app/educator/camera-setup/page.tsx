"use client";
import { DeviceSetup } from "@/components/DeviceSetup";
import { PageHeader } from "@/components/ui";

export default function CameraSetupPage() {
  return (
    <>
      <PageHeader title="Camera setup" subtitle="Choose up to two cameras — e.g. your face and your desk or whiteboard. Saved for every class." />
      <DeviceSetup multi />
    </>
  );
}
