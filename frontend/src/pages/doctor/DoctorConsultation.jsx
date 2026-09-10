import React from 'react';
import { useParams } from 'react-router-dom';
import ConsultationWorkspace from '../../components/doctor/ConsultationWorkspace';

export default function DoctorConsultation() {
  const { encounterId } = useParams();

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <ConsultationWorkspace encounterId={encounterId} />
    </div>
  );
}
