import React from 'react';
import ChangeDeltaPanel from './ChangeDeltaPanel';

export default function ChangeDelta({ previousVisitDate, changes = [] }) {
  return <ChangeDeltaPanel previousVisitDate={previousVisitDate} changes={changes} />;
}
