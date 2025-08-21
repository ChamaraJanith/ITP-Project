import Consultation from '../model/Consultation.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

//add a new consultation
export const addConsultation = async (req, res) => {
    try {
        const newConsult = new Consult(req.body);
        await newConsult.save();
        res.status(201).json({
            success: true, 
            message: 'Consultation added successfully',
            data: newConsult });

    } catch (error) {
        console.error('❌ Error adding consultation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding consultation', 
            error: error.message });
    }
};

//get all consultations
export const getAllConsultations = async (req, res) => {
    try {
        const consultations = await Consultation.find();
        res.status(200).json({
            success: true,
            message: 'Consultations retrieved successfully',
            data: consultations
        });
    } catch (error) {
        console.error('❌ Error retrieving consultations:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving consultations',
            error: error.message
        });
    }
}