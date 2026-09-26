# MARG — Smart, Safe & Community-Driven Travel Platform

> **MARG** is a full-stack travel platform designed to connect travellers with local tourism services while enabling more personalized, affordable, safer and responsible travel experiences.

---

## 🏆 Hackathon Project

### Team EcoNova

**Team Members**
- Manu Raj Kaushik
- Tannu Sharma
- Smriti Kumari

---

## 🌍 About MARG

Travel planning is often fragmented across multiple platforms. Travellers may need to search separately for accommodation, transport, activities, local experiences and destination information.

**MARG brings these elements together into one connected travel ecosystem.**

The platform connects:

**Travellers ↔ Local Service Providers ↔ Tourism Ecosystem**

MARG focuses on personalized travel planning, local community participation, safety-oriented features and responsible tourism.

---

## 🎯 Problem Statement

Modern travellers face several challenges:

- Travel planning is scattered across multiple platforms.
- Finding authentic local experiences can be difficult.
- Budget management during trip planning can be inconvenient.
- Popular destinations can become overcrowded.
- Local businesses and service providers may have limited digital visibility.
- Safety features are often separate from the travel-planning experience.
- Travellers need better ways to discover community-oriented tourism options.

---

## 💡 Our Solution

MARG provides a unified platform where travellers can plan and manage their journeys while local tourism providers can digitally showcase their services.

### For Travellers

- AI-assisted trip planning
- Budget-based travel planning
- Interest-based recommendations
- Less-crowded destination preferences
- Local experiences and services
- Hotel, transport and activity discovery
- Booking management
- Companion traveller information
- SOS / safety interface
- Responsible-travel concepts

### For Service Providers

Local providers can create tourism listings such as:

- 🏨 Hotels & Homestays
- 🚗 Transport
- 🍲 Local Food Experiences
- 🎨 Artisan Experiences
- 🧭 Local Guides
- 🏔️ Tourism Experiences

Published services can then become discoverable through the traveller marketplace.

### For Administrators

The platform includes an administrative layer for managing the tourism ecosystem:

- Traveller management
- Service Provider management
- Provider approval
- Service/listing monitoring
- Booking monitoring
- SOS monitoring
- Reviews and reports
- Destination management
- Platform analytics
- AI / tourism-data integration status

---

# ✨ Key Features

## 1. AI-Assisted Trip Planning

MARG is designed to help travellers build personalized travel plans using factors such as:

- Destination
- Budget
- Interests
- Trip duration
- Crowd preference

The goal is to provide more personalized planning instead of generic travel recommendations.

---

## 2. Community-Driven Tourism

MARG gives local tourism providers a digital platform to showcase their services directly to travellers.

The ecosystem brings together:

**Food + Culture + Guides + Transport + Stays + Experiences**

This helps travellers discover local experiences while giving local providers greater digital visibility.

---

## 3. Budget-Aware Travel

Travellers can specify their available budget while planning their journey.

MARG is designed to help travellers discover options that better fit their budget and preferences.

---

## 4. Crowd-Aware Tourism

MARG incorporates the concept of discovering alternatives to heavily crowded destinations.

This supports:

- Better traveller experiences
- Destination diversification
- Local tourism development
- More responsible tourism

---

## 5. Safety & SOS

The platform includes an SOS/safety interface as part of the traveller experience.

Administrators can also monitor SOS-related requests through the admin dashboard.

> **Prototype note:** The current SOS feature demonstrates the product workflow. It should not be considered a live emergency-response service until connected to an appropriate emergency-response provider.

---

## 6. Service Provider Marketplace

Service providers can publish tourism offerings containing:

- Service name
- Category
- Destination
- Price
- Capacity
- Contact information
- Description
- Publication status

Only approved/published services are made available to travellers.

---

## 7. Admin Control Layer

MARG includes a dedicated admin portal for platform management.

Administrators can monitor:

- Users
- Service Providers
- Services
- Bookings
- Safety requests
- Platform statistics

Service Providers can also go through an approval workflow before their services become publicly available.

---

# 🔐 Authentication & User Roles

MARG separates the platform into three major roles.

### Traveller

```text
Registration
     ↓
OTP Verification
     ↓
Traveller Login
     ↓
Traveller Dashboard
Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Phone numbers should be entered in international/E.164 format when required by the SMS provider.

### Render environment variables
Add the OTP variables to the backend Web Service environment. Never put these secrets in the frontend or commit them to GitHub.
