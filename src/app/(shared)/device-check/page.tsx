"use client";
import { DeviceSetup } from "@/components/DeviceSetup";
import { PageHeader } from "@/components/ui";

export default function DeviceCheckPage() {
  return (
    <>
      <PageHeader title="Device check" subtitle="Test your camera, microphone, speakers and connection before class." />
      <DeviceSetup />
    </>
  );
}
