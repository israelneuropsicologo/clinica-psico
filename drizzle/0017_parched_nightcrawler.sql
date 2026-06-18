ALTER TABLE `anamnese` ADD `currentDiseaseHistory` text;--> statement-breakpoint
ALTER TABLE `anamnese` ADD `psychiatricHistory` text;--> statement-breakpoint
ALTER TABLE `anamnese` ADD `childhoodHistory` text;--> statement-breakpoint
ALTER TABLE `anamnese` ADD `relationshipHistory` text;--> statement-breakpoint
ALTER TABLE `anamnese` ADD `professionalHistory` text;--> statement-breakpoint
ALTER TABLE `anamnese` ADD `substanceUse` text;--> statement-breakpoint
ALTER TABLE `anamnese` ADD `sleepAndEating` text;--> statement-breakpoint
ALTER TABLE `anamnese` ADD `sexualAffectiveLife` text;--> statement-breakpoint
ALTER TABLE `anamnese` ADD `cidDescription` varchar(255);--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `sessionNumber` int;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `sessionType2` enum('individual','couple','group','evaluation') DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `modality2` enum('in_person','online') DEFAULT 'in_person';--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `sessionLocation` varchar(255);--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `emotionalState` varchar(100);--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `predominantMood` varchar(100);--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `sufferingLevel` int;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `currentMedications` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `generalPresentation` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `mainDemand` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `topicsAddressed` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `relevantNarrative` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `clinicalAssessment` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `technicalAnalysis` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `techniquesUsed` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `plannedInterventions` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `therapeuticPlan` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `treatmentResponse` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `goalsProgress` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `observedInsights` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `observedResistances` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `nextSessionDate` varchar(10);--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `nextSessionGoals` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `treatmentPlanAdjustments` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `selfHarmRisk` enum('absent','low','moderate','high','extreme') DEFAULT 'absent';--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `thirdPartyRisk` enum('absent','low','moderate','high','extreme') DEFAULT 'absent';--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `suicideRisk` enum('absent','low','moderate','high','extreme') DEFAULT 'absent';--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `countertransference` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `clinicalHypotheses` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `supervisionNotes` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `referrals` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `privateObservations` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `aiTechnicalFeedback` text;--> statement-breakpoint
ALTER TABLE `clinical_notes` ADD `aiTechnicalFeedbackAt` bigint;--> statement-breakpoint
ALTER TABLE `patients` ADD `addressNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `patients` ADD `addressComplement` varchar(100);--> statement-breakpoint
ALTER TABLE `patients` ADD `neighborhood` varchar(100);--> statement-breakpoint
ALTER TABLE `patients` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `patients` ADD `state` varchar(2);--> statement-breakpoint
ALTER TABLE `patients` ADD `zipCode` varchar(10);--> statement-breakpoint
ALTER TABLE `patients` ADD `phone2` varchar(30);--> statement-breakpoint
ALTER TABLE `patients` ADD `insuranceName` varchar(255);--> statement-breakpoint
ALTER TABLE `patients` ADD `insuranceNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `patients` ADD `insurancePlan` varchar(100);--> statement-breakpoint
ALTER TABLE `patients` ADD `insuranceExpiry` varchar(10);--> statement-breakpoint
ALTER TABLE `patients` ADD `gender` enum('male','female','other','prefer_not_to_say');--> statement-breakpoint
ALTER TABLE `patients` ADD `maritalStatus` enum('single','married','divorced','widowed','stable_union','other');--> statement-breakpoint
ALTER TABLE `patients` ADD `schooling` enum('no_schooling','elementary','middle','high_school','college','postgrad');--> statement-breakpoint
ALTER TABLE `patients` ADD `religion` varchar(100);