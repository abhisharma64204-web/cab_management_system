# Cab Management System - Database Design and Execution Plan

## 1. Real-World Problem Decomposition

### 1.1 Problem Definition
A Cab Management System must coordinate three volatile real-world dimensions at once:
- Demand volatility: rider requests arrive unpredictably by time and location.
- Supply volatility: drivers continuously shift between online, offline, busy, and unavailable states.
- State-critical transactions: a single trip moves through tightly controlled states where mistakes create financial loss, customer churn, and legal risk.

The core business problem is not only booking rides. It is guaranteeing that each ride request is matched to one eligible driver quickly, fairly, and consistently, while preserving a complete and auditable history of operational and payment events.

### 1.2 Manual vs System Bottlenecks
Manual dispatch bottlenecks:
- Human dispatcher latency introduces delay in finding nearby drivers.
- Driver availability is stale and error-prone when tracked manually.
- Double assignment risk increases when many calls arrive simultaneously.
- Trip state transitions are inconsistently recorded, causing billing disputes.
- Revenue reconciliation and driver payout become delayed and inaccurate.

Systemized database-driven bottlenecks to solve:
- High write concurrency during peak traffic.
- Near-real-time read needs for matching and status visibility.
- Strict consistency needs for assignment and payment recording.
- Historical retention for reporting, compliance, and dispute resolution.

### 1.3 Measurable Goals
Primary measurable goals:
- Median matching time from request creation to driver assignment below a defined business threshold (for example, under 10-20 seconds in dense zones).
- Assignment conflict rate (double booking attempts) near zero.
- Trip state integrity errors (invalid state transitions) near zero.
- Payment completion success above target reliability (for example, above 99%).
- Reporting freshness aligned with business SLA (near real-time ops dashboards; scheduled financial reports).

---

## 2. System Thinking Approach

The system is decomposed into four database-centered subsystems with clear boundaries.

### 2.1 Matching System
Responsibilities:
- Accept ride request context (pickup, drop, time, service type).
- Evaluate eligible drivers (availability, proximity, vehicle compatibility, policy constraints).
- Reserve one driver for one request safely under concurrency.
- Persist assignment attempt history for observability and fallback.

Why this matters:
Matching is the highest-concurrency decision point. Its data model must prioritize correctness under race conditions while enabling low-latency lookups.

### 2.2 Ride Lifecycle System
Responsibilities:
- Maintain canonical trip state progression: requested -> assigned -> driver_arrived -> ongoing -> completed or canceled.
- Record timestamps and actors for each transition.
- Enforce valid transitions and prevent contradictory states.

Why this matters:
Lifecycle state is the operational truth for customer communication, driver app behavior, billing triggers, and analytics.

### 2.3 Payment System
Responsibilities:
- Store fare estimate, fare components, final charge, payment method, and payment status.
- Persist payment attempts and outcomes with reference identifiers for reconciliation.
- Link financial records to immutable trip identifiers.

Why this matters:
Payments require auditability, idempotency, and failure handling. Financial consistency must be stronger than eventual consistency assumptions.

### 2.4 Driver Management System
Responsibilities:
- Track driver profile, verification status, vehicle association, and serviceability.
- Track dynamic availability and current assignment state.
- Capture operational constraints (shift status, suspension, city permits).

Why this matters:
Driver data quality determines matching quality. Incorrect availability directly causes poor rider experience and assignment conflicts.

---

## 3. Requirement Engineering

### 3.1 Functional Requirements
1. Rider can create a ride request with pickup and drop details.
2. System can identify and assign one eligible driver for each active request.
3. Driver can accept or reject assignment within a bounded decision window.
4. Trip state can progress only through valid lifecycle transitions.
5. Trip completion must trigger fare finalization and payment workflow.
6. Rider or driver can cancel under policy conditions; reason codes are stored.
7. Driver availability updates must be reflected immediately in matching eligibility.
8. System must support operational and business reporting (demand, supply, revenue, completion rates).

### 3.2 Non-Functional Requirements
Latency:
- Matching reads and assignment writes must meet low-latency targets under peak load.

Scalability:
- Data model must support growth in rides, drivers, and cities without redesign.

Consistency:
- Strong consistency is required for assignment lock and payment finalization.
- Eventual consistency is acceptable for non-critical dashboards and aggregations.

Reliability:
- No data loss for trip and payment events.
- Recoverable retry paths for transient failures.

Auditability:
- Historical transitions, assignment attempts, and payment attempts must be traceable.

Security and privacy:
- PII must be logically segregated and access-controlled.
- Sensitive payment data must be tokenized and not duplicated unnecessarily.

---

## 4. Data-Centric Design Thinking

### 4.1 Core Data Objects
- Rider
- Driver
- Vehicle
- DriverAvailabilitySnapshot
- RideRequest
- RideAssignment
- Trip
- TripStateHistory
- Fare
- Payment
- PaymentAttempt
- LocationReference (normalized geospatial anchor where needed)

### 4.2 Why Each Core Object Exists
- Rider and Driver separate the two principal actors with distinct lifecycle and policy rules.
- Vehicle exists because driver identity and vehicle compliance are separate business concerns.
- DriverAvailabilitySnapshot captures high-frequency mutable state without polluting immutable profile records.
- RideRequest captures user intent before assignment success.
- RideAssignment captures decision history and prevents hidden reassignment ambiguity.
- Trip is the business contract formed after assignment acceptance.
- TripStateHistory provides immutable traceability of transitions for dispute resolution.
- Fare isolates pricing logic output from trip orchestration.
- Payment and PaymentAttempt separate business payment state from gateway interaction events.

### 4.3 Data Ownership Boundaries
- Matching owns driver eligibility and assignment decisions.
- Trip lifecycle owns canonical trip state and transition correctness.
- Payment owns financial state and external settlement references.
- Reporting consumes derived views; it does not own operational truth.

Boundary rule:
A subsystem may reference another subsystem’s identifier, but only the owning subsystem can authoritatively mutate the core state for its entity.

---

## 5. Entity Design (Deep)

### 5.1 Rider
Attributes:
- RiderId
- Name
- PhoneContactRef
- RatingAggregate
- AccountStatus
- CreatedAt, UpdatedAt

Primary key reasoning:
- RiderId is a stable surrogate key independent of mutable contact details.

Why attributes are needed:
- Contact reference supports communication workflows.
- Rating aggregate informs driver-side risk and platform trust scoring.
- Account status controls booking permissions.

### 5.2 Driver
Attributes:
- DriverId
- Name
- PhoneContactRef
- VerificationStatus
- ServiceCityId
- DriverStatus (active, suspended, etc.)
- CreatedAt, UpdatedAt

Primary key reasoning:
- DriverId must remain stable across phone changes, city transfers, and profile updates.

Why attributes are needed:
- Verification and status are mandatory eligibility gates.
- City linkage supports jurisdictional policies and localization.

### 5.3 Vehicle
Attributes:
- VehicleId
- DriverId (current owner/operator link)
- RegistrationNumber
- VehicleType
- SeatingCapacity
- ComplianceStatus
- CreatedAt, UpdatedAt

Primary key reasoning:
- VehicleId separates internal identity from externally mutable registration details.

Why attributes are needed:
- Vehicle type and compliance directly impact match eligibility and legal operations.

### 5.4 DriverAvailabilitySnapshot
Attributes:
- SnapshotId
- DriverId
- AvailabilityState (online, offline, busy)
- CurrentGeoCell
- LastHeartbeatAt
- ActiveTripId (nullable)

Primary key reasoning:
- SnapshotId supports append or versioned updates for operational debugging.

Why attributes are needed:
- Heartbeat freshness prevents matching stale drivers.
- ActiveTripId prevents accidental reassignment.

### 5.5 RideRequest
Attributes:
- RideRequestId
- RiderId
- PickupLocationRef
- DropLocationRef
- ServiceType
- RequestStatus (open, matched, expired, canceled)
- RequestedAt
- ExpireAt

Primary key reasoning:
- RideRequestId uniquely captures each booking intent even if rider retries.

Why attributes are needed:
- Status and expiry support controlled lifecycle before trip creation.
- Service type constrains compatible driver/vehicle matches.

### 5.6 RideAssignment
Attributes:
- RideAssignmentId
- RideRequestId
- DriverId
- AssignmentState (offered, accepted, rejected, timed_out)
- OfferedAt
- RespondedAt
- SelectionRank

Primary key reasoning:
- RideAssignmentId allows preserving full assignment attempt history.

Why attributes are needed:
- Selection rank supports explainability of matching decisions.
- State fields support timeout and retry logic.

### 5.7 Trip
Attributes:
- TripId
- RideRequestId
- AssignedDriverId
- RiderId
- TripState
- StartTime
- EndTime
- DistanceMeasured
- DurationMeasured

Primary key reasoning:
- TripId is the long-lived anchor for operations, billing, support, and analytics.

Why attributes are needed:
- Independent trip state and timing fields power SLA, billing, and incident analysis.

### 5.8 TripStateHistory
Attributes:
- TripStateEventId
- TripId
- PreviousState
- NewState
- EventTime
- ActorType (system, rider, driver)
- ReasonCode

Primary key reasoning:
- EventId allows immutable event logging per transition.

Why attributes are needed:
- Actor and reason fields are essential for dispute handling and policy audits.

### 5.9 Fare
Attributes:
- FareId
- TripId
- BaseFare
- DistanceFare
- TimeFare
- DynamicAdjustment
- TaxesAndFees
- TotalFare
- Currency

Primary key reasoning:
- FareId isolates fare computation artifact from trip orchestration object.

Why attributes are needed:
- Component-level storage enables transparent breakdown and future policy changes.

### 5.10 Payment
Attributes:
- PaymentId
- TripId
- RiderId
- PaymentMethodRef
- PaymentState (pending, authorized, captured, failed, refunded)
- Amount
- Currency
- CreatedAt, SettledAt

Primary key reasoning:
- PaymentId provides a stable reference for all settlement operations.

Why attributes are needed:
- State model supports asynchronous payment workflows and partial failures.

### 5.11 PaymentAttempt
Attributes:
- PaymentAttemptId
- PaymentId
- AttemptSequence
- GatewayReference
- AttemptState
- AttemptedAt
- FailureReason

Primary key reasoning:
- AttemptId ensures each retry is independently auditable.

Why attributes are needed:
- Retry history is required for idempotency, reconciliation, and support diagnostics.

---

## 6. Relationship Modeling

1. Rider to RideRequest: one-to-many
Justification:
A rider can make many requests over time; each request belongs to one rider.

2. RideRequest to RideAssignment: one-to-many
Justification:
One request may involve multiple offer attempts before acceptance.

3. Driver to RideAssignment: one-to-many
Justification:
A driver receives many offers over time; each offer targets one driver.

4. RideRequest to Trip: one-to-one (logical, conditional)
Justification:
A successful request results in at most one active trip contract.

5. Trip to TripStateHistory: one-to-many
Justification:
A trip experiences multiple state transitions.

6. Driver to Trip: one-to-many
Justification:
A driver completes many trips across time, but only one active trip at a moment by policy.

7. Trip to Fare: one-to-one
Justification:
Each completed or billable trip has one final fare artifact.

8. Trip to Payment: one-to-one or one-to-many (policy-based)
Justification:
Single payment is default; expanded models can support split payments or adjustments.

9. Payment to PaymentAttempt: one-to-many
Justification:
A payment may require retries across transient failures.

10. Driver to Vehicle: one-to-many over history, one-to-one active mapping at a time
Justification:
A driver may change vehicles over time; operations require one active vehicle binding during a trip.

---

## 7. ER Diagram Blueprint (Textual)

How to draw the ER diagram:
1. Place strong entities centrally: Rider, Driver, Vehicle, RideRequest, RideAssignment, Trip, Fare, Payment.
2. Place event/history entities adjacent to their parent: TripStateHistory next to Trip; PaymentAttempt next to Payment.
3. Represent DriverAvailabilitySnapshot as a state-support entity linked to Driver.
4. Use crow’s-foot notation to indicate one-to-many relationships listed in section 6.
5. Mark conditional one-to-one from RideRequest to Trip (only when assignment is accepted).
6. Attach relationship attributes where decision context matters:
- RideAssignment relationship carries SelectionRank, OfferedAt, RespondedAt.
- Trip state transition relationship materialized via TripStateHistory with actor and reason attributes.

Weak entities:
- TripStateHistory and PaymentAttempt behave as dependent entities (existence tied to parent Trip and Payment).

---

## 8. Logical Schema Design

### 8.1 ER to Relational Conversion Principles
- Each strong entity maps to a primary relation with a surrogate key.
- Dependent/history entities map to separate relations with foreign key references to parent entities.
- Many operational statuses are represented as constrained domains to enforce state validity.

### 8.2 Foreign Key and Dependency Reasoning
- RideRequest references Rider because request ownership is mandatory.
- RideAssignment references both RideRequest and Driver to preserve matchmaking decisions.
- Trip references RideRequest, Rider, and AssignedDriver to freeze core business linkage.
- TripStateHistory references Trip to produce immutable state audit chain.
- Fare references Trip to isolate pricing output while preventing orphan billing.
- Payment references Trip and Rider for financial ownership and reconciliation.
- PaymentAttempt references Payment for retry traceability.

### 8.3 Redundancy Avoidance Strategy
- Avoid storing mutable driver availability in Trip or RideRequest tables.
- Keep payment gateway details out of trip records; store only references.
- Preserve normalized location references for reuse and consistency where geospatial precision policy requires.

---

## 9. Normalization Strategy

### 9.1 Anomalies to Prevent
- Update anomaly: changing driver verification in multiple unrelated tables.
- Insert anomaly: inability to register a driver without creating a trip.
- Delete anomaly: losing payment history when archiving trips.

### 9.2 Normalization Decisions
- At least 2NF and 3NF for operational core entities to remove partial and transitive dependencies.
- BCNF target for high-integrity entities where determinant ambiguity may emerge (for example, unique operational identifiers and status constraints).

Entity-wise rationale:
- Driver and Vehicle separated to avoid repeating vehicle details across trip rows.
- Fare components isolated from Trip to avoid mixed-granularity columns.
- PaymentAttempt separated from Payment to avoid repeating retry fields in base payment record.

### 9.3 Performance vs Normalization Trade-offs
- Keep transactional path normalized for correctness.
- Use derived read models/materialized aggregates for high-volume reporting instead of denormalizing write-critical tables.
- Introduce selective redundancy only when backed by clear latency gains and strict synchronization policy.

---

## 10. Core Problem Resolution via Database

This section explains exactly how the database solves real operational challenges.

### 10.1 Fast Driver Matching
Step flow:
1. New RideRequest is persisted with open status and geospatial pickup reference.
2. Matching subsystem reads eligible DriverAvailabilitySnapshot records filtered by city, service type compatibility, heartbeat freshness, and availability state.
3. Candidate set is ranked by proximity and policy factors.
4. Top candidate receives RideAssignment offer persisted as offered.

Why it is fast:
- Matching reads target a narrow, indexed, high-frequency availability dataset rather than scanning historical trip data.
- Status-driven filtering prunes non-eligible drivers early.

### 10.2 Avoiding Double Booking
Step flow:
1. Assignment attempt and driver busy transition are committed as one atomic decision boundary.
2. Driver record or availability snapshot enforces one active trip invariant.
3. Competing requests attempting same driver fail deterministic consistency checks.

Why it is safe:
- Assignment correctness is guarded by transactional constraints and state invariants, not by best-effort application timing.

### 10.3 Maintaining Consistency Across Lifecycle
Step flow:
1. Trip is created only after assignment acceptance.
2. TripState changes are validated against allowed transition graph.
3. Every transition writes an immutable TripStateHistory event.
4. Billing and payment become eligible only after terminal completion conditions.

Why it is consistent:
- Canonical state lives in one place (Trip.TripState), while history is append-only for audit.
- Invalid jumps (for example, requested directly to completed) are blocked by transition constraints.

### 10.4 Handling Concurrent Ride Requests
Scenario-based reasoning:
- Two riders request rides simultaneously in low-supply area.
- Both matching routines see overlapping candidate drivers.
- First transaction reserves Driver D and marks busy.
- Second transaction retries candidate evaluation and either selects alternate driver or leaves request open/pending.

Outcome:
- No duplicate active assignment for Driver D.
- Request-level status remains truthful: matched, pending, or expired based on deterministic outcomes.

### 10.5 Payment Consistency Under Retries
Scenario-based reasoning:
- Trip completed, payment initiation starts.
- External gateway timeout occurs.
- PaymentAttempt captures failed attempt with reason and sequence.
- Retry proceeds idempotently with same business payment context.

Outcome:
- Financial state is auditable and recoverable without duplicate charge ambiguity.

---

## 11. Step-by-Step Execution Plan (No Code)

1. Requirement gathering
What to do:
- Capture rider, driver, operations, finance, and support workflows.
- Define SLAs, policy constraints, and compliance requirements.
Why:
- Prevents designing schema around assumptions that break real operations.

2. Entity identification
What to do:
- Extract nouns and stateful objects from validated workflows.
- Distinguish master data from high-frequency operational data.
Why:
- Correct entity boundaries are the foundation of consistency and scalability.

3. ER modeling
What to do:
- Draw entities and relationships with cardinalities and optionality.
- Validate lifecycle and payment paths with domain stakeholders.
Why:
- Early structural validation catches data gaps before schema hardening.

4. Logical schema design
What to do:
- Map ER model to relational structures with keys and dependencies.
- Define state domains and ownership boundaries.
Why:
- Converts business logic into enforceable data constraints.

5. Constraint definition
What to do:
- Define uniqueness, referential integrity, transition validity, and assignment invariants.
- Identify transaction boundaries for critical write paths.
Why:
- Constraints are primary defense against corruption under concurrency.

6. Data validation planning
What to do:
- Define validation checks for orphan records, invalid states, duplicate assignments, and payment mismatches.
- Plan periodic integrity audits.
Why:
- Ongoing validation ensures operational correctness beyond initial rollout.

7. Testing planning
What to do:
- Plan functional, concurrency, failure, and load test suites aligned to risks.
- Define pass/fail metrics and observability signals.
Why:
- Testing proves that design decisions hold under realistic stress and edge conditions.

---

## 12. Demonstration Design

Demonstration objective:
Show that the data model enforces correct matching, lifecycle integrity, and financial consistency.

### 12.1 Scenario 1: Rider Requests Ride -> Driver Assigned
Data setup:
- One rider, two drivers in same service zone.
- One driver marked available with fresh heartbeat, one unavailable.

Conceptual operations:
- Create ride request.
- Run matching selection logic against eligible driver dataset.
- Persist assignment decision and update request status.

Expected proof output:
- Exactly one assignment record in accepted or offered state for the request.
- Assigned driver changes to busy or reserved availability.
- Request status reflects matched state.

### 12.2 Scenario 2: Ride Completion -> Payment Recorded
Data setup:
- Existing trip in ongoing state with assignment completed.

Conceptual operations:
- Transition trip to completed through valid state path.
- Compute and store fare components.
- Create payment record and at least one payment attempt outcome.

Expected proof output:
- Trip state reaches completed with corresponding state-history events.
- Fare total exists and links to trip.
- Payment state is consistent with attempt history.

### 12.3 Scenario 3: Multiple Requests -> Correct Allocation
Data setup:
- Multiple simultaneous open requests in same zone.
- Limited available drivers.

Conceptual operations:
- Trigger concurrent matching workflows.
- Enforce assignment invariants and retries for conflicts.

Expected proof output:
- No driver appears as active assignment for more than one trip at same time.
- Excess requests remain pending or expire per policy, not falsely matched.
- Assignment attempts provide traceability of fallback behavior.

---

## 13. Testing Strategy

### 13.1 Correctness and Integrity Testing
Validate:
- Referential integrity across rider, request, assignment, trip, fare, and payment chains.
- Allowed state transition enforcement.
- No orphan payment or history records.

Success criteria:
- Integrity checks return zero critical violations.

### 13.2 Concurrency Testing
Validate:
- Simultaneous assignment attempts for same driver.
- High-volume request bursts in same zone.
- Payment retries under delayed gateway responses.

Success criteria:
- No double booking.
- Deterministic final state for each request.
- No duplicate financial capture for one payment context.

### 13.3 Edge Case Testing
Driver unavailable:
- Ensure request remains unassigned with explicit pending/expired reason.

Ride cancellation:
- Ensure state transitions to canceled are valid and actor/reason are recorded.

Payment failure:
- Ensure payment remains failed/pending with attempt history and retry path.

Success criteria:
- Edge outcomes are explicit, auditable, and policy-compliant.

### 13.4 Performance Testing
Validate:
- Matching latency under expected and peak concurrent workloads.
- Write contention behavior on assignment-critical paths.
- Reporting query isolation from transactional performance.

Success criteria:
- SLA compliance under load with no integrity regressions.

---

## 14. Frontend and Backend Requirements (Demo Scope Only)

No implementation is included here. This section defines demonstration-facing requirements only.

### 14.1 Frontend Screens
1. Rider app screens:
- Ride request screen (pickup/drop selection, service type).
- Ride status screen (driver assigned, ETA, trip progress).
- Payment summary screen.

2. Driver app screens:
- Availability toggle dashboard.
- Incoming assignment offer screen.
- Trip status update screen.

3. Operations console:
- Live request-assignment monitor.
- Trip lifecycle audit view.
- Payment status and failure queue view.

DB interaction focus:
- Screens read canonical status from request, assignment, trip, and payment entities.
- User actions trigger controlled state transitions that must be persisted with audit context.

### 14.2 Backend Modules
1. Matching module:
- Reads availability and request context, writes assignments.

2. Ride lifecycle module:
- Validates and persists state transitions with history events.

3. Payment module:
- Manages fare finalization and payment state/attempt records.

4. Reporting module:
- Builds operational and financial aggregates from canonical tables.

DB interaction focus:
- Modules are separated by data ownership boundaries.
- Critical modules use transactional writes; reporting consumes derived read models.

---

## 15. Scalability and Future Design

### 15.1 Multi-City Support
Design support:
- City and service-zone dimensions are first-class attributes in driver and request data.
- Partitioning strategy can align with city or region to reduce contention and improve locality.

### 15.2 Surge Pricing
Design support:
- Fare is componentized, allowing insertion of dynamic adjustment fields without trip model disruption.
- Surge policy snapshots can be linked to request/time/location context for explainable billing.

### 15.3 Real-Time Tracking
Design support:
- High-frequency location updates remain separate from core immutable trip contract records.
- Latest-state snapshots feed rider/driver live views while historical events remain auditable.

### 15.4 Future Reliability Enhancements
- Event-driven outbox for cross-module reliability.
- Archival strategy for old trips and payment attempts to keep hot path lean.
- Advanced fraud and anomaly detection using historical assignment and payment patterns.

### 15.5 Why This Design Is Expansion-Ready
- Core transactional entities are normalized and integrity-focused.
- High-change concerns (availability, tracking, retries) are isolated from stable master entities.
- Clear subsystem ownership prevents schema drift and uncontrolled coupling.
- Historical audit structures support governance, compliance, and ML-driven optimization later.
