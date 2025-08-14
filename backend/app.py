from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime, date
from bson import ObjectId
import pymongo
from pymongo import MongoClient
import uvicorn
from decimal import Decimal

app = FastAPI(title="Milk POS Management API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client.mpms_db

# Collections
farmers_collection = db.farmers
collections_collection = db.milk_collections
expenses_collection = db.expenses
advances_collection = db.advances

# Pydantic models
class Cow(BaseModel):
    cow_id: str
    breed: Optional[str] = ""

class FarmerCreate(BaseModel):
    name: str
    phone: str
    address: str
    num_cows: int

class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    cows: Optional[List[Cow]] = None

class MilkCollectionCreate(BaseModel):
    date: str
    session: str
    farmer_id: str
    per_cow_liters: Dict[str, float]
    daily_rate: float
    deduct_full_amount: Optional[bool] = False
    per_liter_deduction: Optional[float] = 0.0

class MilkCollectionUpdate(BaseModel):
    date: Optional[str] = None
    session: Optional[str] = None
    per_cow_liters: Optional[Dict[str, float]] = None
    daily_rate: Optional[float] = None
    deduct_full_amount: Optional[bool] = None
    per_liter_deduction: Optional[float] = None

class ExpenseCreate(BaseModel):
    date: str
    farmer_id: str
    type: str
    description: str
    amount: float
    is_credit: Optional[bool] = False

class ExpenseUpdate(BaseModel):
    date: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    is_credit: Optional[bool] = None

class AdvanceCreate(BaseModel):
    farmer_id: str
    date: str
    amount_given: float

class AdvanceUpdate(BaseModel):
    remaining: Optional[float] = None

# Helper functions
def object_id_str(obj_id):
    return str(obj_id) if obj_id else None

def get_farmer_by_id(farmer_id: str):
    farmer = farmers_collection.find_one({"_id": ObjectId(farmer_id)})
    if farmer:
        farmer["_id"] = str(farmer["_id"])
        return farmer
    return None

def calculate_deductions(farmer_id: str, collection_value: float, total_liters: float, deduct_full_amount: bool, per_liter_deduction: float):
    # Get pending expenses
    expenses = list(expenses_collection.find({"farmer_id": ObjectId(farmer_id), "is_credit": True}))
    total_pending_expenses = sum(exp["amount"] for exp in expenses)

    # Get advances with remaining balance
    advances = list(advances_collection.find({"farmer_id": ObjectId(farmer_id), "remaining": {"$gt": 0}}))
    total_advance_remaining = sum(adv["remaining"] for adv in advances)

    # Calculate deductions
    expense_deduction = min(total_pending_expenses, collection_value * 0.3)  # Max 30% for expenses
    advance_deduction = 0

    if deduct_full_amount:
        # Deduct full remaining amount up to collection value
        advance_deduction = min(total_advance_remaining, collection_value * 0.7)  # Max 70% for advances
    elif per_liter_deduction > 0:
        # Deduct based on per-liter rate
        advance_deduction = min(total_advance_remaining, total_liters * per_liter_deduction)

    total_deduction = expense_deduction + advance_deduction
    final_amount = collection_value - total_deduction

    return {
        "expense_deduction": expense_deduction,
        "advance_deduction": advance_deduction,
        "total_deduction": total_deduction,
        "final_amount": final_amount,
        "total_pending_expenses": total_pending_expenses,
        "total_advance_remaining": total_advance_remaining,
    }

def update_deductions(farmer_id: str, expense_deduction: float, advance_deduction: float, collection_date: str, deduction_type: str = "Advance"):
    # Update expenses
    if expense_deduction > 0:
        expenses = list(expenses_collection.find({"farmer_id": ObjectId(farmer_id), "is_credit": True}).sort("date", 1))
        remaining_deduction = expense_deduction
        for expense in expenses:
            if remaining_deduction <= 0:
                break
            deduct_amount = min(remaining_deduction, expense["amount"])
            expenses_collection.update_one(
                {"_id": expense["_id"]},
                {"$inc": {"amount": -deduct_amount}}
            )
            # Log deduction in advances
            advances_collection.update_one(
                {"farmer_id": ObjectId(farmer_id), "remaining": {"$gt": 0}},
                {
                    "$inc": {"remaining": -deduct_amount},
                    "$push": {
                        "deduction_logs": {
                            "date": collection_date,
                            "amount_deducted": deduct_amount,
                            "type": "Expense",
                        }
                    },
                },
                upsert=True,
            )
            remaining_deduction -= deduct_amount

    # Update advances
    if advance_deduction > 0:
        advances = list(advances_collection.find({"farmer_id": ObjectId(farmer_id), "remaining": {"$gt": 0}}).sort("date", 1))
        remaining_deduction = advance_deduction
        for advance in advances:
            if remaining_deduction <= 0:
                break
            deduct_amount = min(remaining_deduction, advance["remaining"])
            advances_collection.update_one(
                {"_id": advance["_id"]},
                {
                    "$inc": {"remaining": -deduct_amount},
                    "$push": {
                        "deduction_logs": {
                            "date": collection_date,
                            "amount_deducted": deduct_amount,
                            "type": deduction_type,
                        }
                    },
                }
            )
            remaining_deduction -= deduct_amount

def generate_sms_text(farmer_name: str, date: str, session: str, total_liters: float, daily_rate: float, value: float, per_cow_details: Dict[str, float], deductions: Dict, per_liter_deduction: float):
    cow_breakdown = ", ".join([f"{cow}: {liters}L" for cow, liters in per_cow_details.items()])

    sms_text = f"Farmer: {farmer_name}\n"
    sms_text += f"Date: {date}, {session}\n"
    sms_text += f"Total: {total_liters}L @ ₹{daily_rate}/L = ₹{value:.2f}\n"
    sms_text += f"Breakdown: {cow_breakdown}\n"

    if deductions["total_deduction"] > 0:
        sms_text += f"Deductions: ₹{deductions['total_deduction']:.2f}"
        if per_liter_deduction > 0:
            sms_text += f" (@ ₹{per_liter_deduction}/L)\n"
        else:
            sms_text += "\n"
        sms_text += f"Final Amount: ₹{deductions['final_amount']:.2f}"
    else:
        sms_text += f"Final Amount: ₹{value:.2f}"

    return sms_text

# Farmer Management Endpoints
@app.post("/farmers/create")
async def create_farmer(farmer: FarmerCreate):
    try:
        cows = []
        for i in range(1, farmer.num_cows + 1):
            cow_id = f"{farmer.name.replace(' ', '')}_Cow{i}"
            cows.append({"cow_id": cow_id, "breed": ""})

        farmer_doc = {
            "name": farmer.name,
            "phone": farmer.phone,
            "address": farmer.address,
            "cows": cows,
        }

        result = farmers_collection.insert_one(farmer_doc)
        farmer_doc["_id"] = str(result.inserted_id)
        return farmer_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/farmers/read")
async def read_farmers(farmer_id: Optional[str] = None):
    try:
        if farmer_id:
            farmer = farmers_collection.find_one({"_id": ObjectId(farmer_id)})
            if farmer:
                farmer["_id"] = str(farmer["_id"])
                return farmer
            raise HTTPException(status_code=404, detail="Farmer not found")
        else:
            farmers = list(farmers_collection.find())
            for farmer in farmers:
                farmer["_id"] = str(farmer["_id"])
            return farmers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/farmers/update/{farmer_id}")
async def update_farmer(farmer_id: str, farmer_update: FarmerUpdate):
    try:
        update_data = {}
        if farmer_update.name:
            update_data["name"] = farmer_update.name
        if farmer_update.phone:
            update_data["phone"] = farmer_update.phone
        if farmer_update.address:
            update_data["address"] = farmer_update.address
        if farmer_update.cows:
            update_data["cows"] = [cow.dict() for cow in farmer_update.cows]

        result = farmers_collection.update_one({"_id": ObjectId(farmer_id)}, {"$set": update_data})

        if result.matched_count:
            return {"message": "Farmer updated successfully"}
        raise HTTPException(status_code=404, detail="Farmer not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/farmers/delete/{farmer_id}")
async def delete_farmer(farmer_id: str):
    try:
        result = farmers_collection.delete_one({"_id": ObjectId(farmer_id)})
        if result.deleted_count:
            return {"message": "Farmer deleted successfully"}
        raise HTTPException(status_code=404, detail="Farmer not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Milk Collection Endpoints
@app.post("/collections/create")
async def create_collection(collection: MilkCollectionCreate):
    try:
        farmer = get_farmer_by_id(collection.farmer_id)
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")

        total_liters = sum(collection.per_cow_liters.values())
        value = total_liters * collection.daily_rate

        # Calculate deductions
        deductions = calculate_deductions(
            collection.farmer_id,
            value,
            total_liters,
            collection.deduct_full_amount,
            collection.per_liter_deduction,
        )

        # Generate SMS text
        sms_text = generate_sms_text(
            farmer["name"],
            collection.date,
            collection.session,
            total_liters,
            collection.daily_rate,
            value,
            collection.per_cow_liters,
            deductions,
            collection.per_liter_deduction,
        )

        collection_doc = {
            "date": collection.date,
            "session": collection.session,
            "farmer_id": ObjectId(collection.farmer_id),
            "per_cow_liters": collection.per_cow_liters,
            "total_liters": total_liters,
            "daily_rate": collection.daily_rate,
            "value": value,
            "deductions": deductions,
            "final_amount": deductions["final_amount"],
            "sms_text": sms_text,
            "deduct_full_amount": collection.deduct_full_amount,
            "per_liter_deduction": collection.per_liter_deduction,
        }

        result = collections_collection.insert_one(collection_doc)

        # Update deductions
        update_deductions(
            collection.farmer_id,
            deductions["expense_deduction"],
            deductions["advance_deduction"],
            collection.date,
            "Advance" if collection.deduct_full_amount or collection.per_liter_deduction > 0 else "Expense",
        )

        collection_doc["_id"] = str(result.inserted_id)
        collection_doc["farmer_id"] = str(collection_doc["farmer_id"])
        return collection_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/collections/read")
async def read_collections(date: Optional[str] = None, farmer_id: Optional[str] = None):
    try:
        query = {}
        if date:
            query["date"] = date
        if farmer_id:
            query["farmer_id"] = ObjectId(farmer_id)

        collections = list(collections_collection.find(query).sort("date", -1))
        for collection in collections:
            collection["_id"] = str(collection["_id"])
            collection["farmer_id"] = str(collection["farmer_id"])
            farmer = get_farmer_by_id(str(collection["farmer_id"]))
            collection["farmer_name"] = farmer["name"] if farmer else "Unknown"

        return collections
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/collections/update/{collection_id}")
async def update_collection(collection_id: str, collection_update: MilkCollectionUpdate):
    try:
        update_data = {}
        if collection_update.date:
            update_data["date"] = collection_update.date
        if collection_update.session:
            update_data["session"] = collection_update.session
        if collection_update.per_cow_liters:
            update_data["per_cow_liters"] = collection_update.per_cow_liters
            update_data["total_liters"] = sum(collection_update.per_cow_liters.values())
        if collection_update.daily_rate:
            update_data["daily_rate"] = collection_update.daily_rate
        if collection_update.deduct_full_amount is not None:
            update_data["deduct_full_amount"] = collection_update.deduct_full_amount
        if collection_update.per_liter_deduction is not None:
            update_data["per_liter_deduction"] = collection_update.per_liter_deduction

        if "total_liters" in update_data and "daily_rate" in update_data:
            update_data["value"] = update_data["total_liters"] * update_data["daily_rate"]

        result = collections_collection.update_one({"_id": ObjectId(collection_id)}, {"$set": update_data})

        if result.matched_count:
            return {"message": "Collection updated successfully"}
        raise HTTPException(status_code=404, detail="Collection not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/collections/delete/{collection_id}")
async def delete_collection(collection_id: str):
    try:
        result = collections_collection.delete_one({"_id": ObjectId(collection_id)})
        if result.deleted_count:
            return {"message": "Collection deleted successfully"}
        raise HTTPException(status_code=404, detail="Collection not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Expense Management Endpoints
@app.post("/expenses/create")
async def create_expense(expense: ExpenseCreate):
    try:
        expense_doc = {
            "date": expense.date,
            "farmer_id": ObjectId(expense.farmer_id),
            "type": expense.type,
            "description": expense.description,
            "amount": expense.amount,
            "is_credit": expense.is_credit,
        }

        result = expenses_collection.insert_one(expense_doc)

        if expense.is_credit:
            # Add to advances.remaining
            advances_collection.update_one(
                {"farmer_id": ObjectId(expense.farmer_id)},
                {
                    "$inc": {"remaining": expense.amount},
                    "$setOnInsert": {
                        "amount_given": 0.0,
                        "date": expense.date,
                        "deduction_logs": [],
                    },
                },
                upsert=True,
            )

        expense_doc["_id"] = str(result.inserted_id)
        expense_doc["farmer_id"] = str(expense_doc["farmer_id"])
        return expense_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/expenses/read")
async def read_expenses(farmer_id: Optional[str] = None):
    try:
        query = {}
        if farmer_id:
            query["farmer_id"] = ObjectId(farmer_id)

        expenses = list(expenses_collection.find(query).sort("date", -1))
        for expense in expenses:
            expense["_id"] = str(expense["_id"])
            expense["farmer_id"] = str(expense["farmer_id"])
            farmer = get_farmer_by_id(str(expense["farmer_id"]))
            expense["farmer_name"] = farmer["name"] if farmer else "Unknown"

        return expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/expenses/update/{expense_id}")
async def update_expense(expense_id: str, expense_update: ExpenseUpdate):
    try:
        expense = expenses_collection.find_one({"_id": ObjectId(expense_id)})
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")

        update_data = {}
        if expense_update.date:
            update_data["date"] = expense_update.date
        if expense_update.type:
            update_data["type"] = expense_update.type
        if expense_update.description:
            update_data["description"] = expense_update.description
        if expense_update.amount is not None:
            update_data["amount"] = expense_update.amount
        if expense_update.is_credit is not None:
            update_data["is_credit"] = expense_update.is_credit

        if expense_update.amount is not None and expense["is_credit"]:
            # Adjust advances.remaining
            amount_diff = expense_update.amount - expense["amount"]
            advances_collection.update_one(
                {"farmer_id": ObjectId(expense["farmer_id"])},
                {"$inc": {"remaining": amount_diff}},
            )

        result = expenses_collection.update_one({"_id": ObjectId(expense_id)}, {"$set": update_data})

        if result.matched_count:
            return {"message": "Expense updated successfully"}
        raise HTTPException(status_code=404, detail="Expense not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/expenses/delete/{expense_id}")
async def delete_expense(expense_id: str):
    try:
        expense = expenses_collection.find_one({"_id": ObjectId(expense_id)})
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")

        result = expenses_collection.delete_one({"_id": ObjectId(expense_id)})
        if result.deleted_count and expense["is_credit"]:
            # Subtract from advances.remaining
            advances_collection.update_one(
                {"farmer_id": ObjectId(expense["farmer_id"])},
                {"$inc": {"remaining": -expense["amount"]}},
            )

        if result.deleted_count:
            return {"message": "Expense deleted successfully"}
        raise HTTPException(status_code=404, detail="Expense not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Advance Management Endpoints
@app.post("/advances/create")
async def create_advance(advance: AdvanceCreate):
    try:
        advance_doc = {
            "farmer_id": ObjectId(advance.farmer_id),
            "date": advance.date,
            "amount_given": advance.amount_given,
            "remaining": advance.amount_given,
            "deduction_logs": [],
        }

        result = advances_collection.insert_one(advance_doc)
        advance_doc["_id"] = str(result.inserted_id)
        advance_doc["farmer_id"] = str(advance_doc["farmer_id"])
        return advance_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/advances/read")
async def read_advances(farmer_id: Optional[str] = None):
    try:
        query = {}
        if farmer_id:
            query["farmer_id"] = ObjectId(farmer_id)

        advances = list(advances_collection.find(query).sort("date", -1))
        for advance in advances:
            advance["_id"] = str(advance["_id"])
            advance["farmer_id"] = str(advance["farmer_id"])
            farmer = get_farmer_by_id(str(advance["farmer_id"]))
            advance["farmer_name"] = farmer["name"] if farmer else "Unknown"

        return advances
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/advances/update/{advance_id}")
async def update_advance(advance_id: str, advance_update: AdvanceUpdate):
    try:
        update_data = {}
        if advance_update.remaining is not None:
            update_data["remaining"] = advance_update.remaining

        result = advances_collection.update_one({"_id": ObjectId(advance_id)}, {"$set": update_data})

        if result.matched_count:
            return {"message": "Advance updated successfully"}
        raise HTTPException(status_code=404, detail="Advance not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/advances/delete/{advance_id}")
async def delete_advance(advance_id: str):
    try:
        result = advances_collection.delete_one({"_id": ObjectId(advance_id)})
        if result.deleted_count:
            return {"message": "Advance deleted successfully"}
        raise HTTPException(status_code=404, detail="Advance not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reports Endpoints
@app.get("/reports/daily")
async def daily_report(date: str):
    try:
        pipeline = [
            {"$match": {"date": date}},
            {
                "$group": {
                    "_id": None,
                    "total_milk": {"$sum": "$total_liters"},
                    "total_value": {"$sum": "$value"},
                    "total_deductions": {"$sum": "$deductions.total_deduction"},
                    "final_amount": {"$sum": "$final_amount"},
                    "collection_count": {"$sum": 1},
                }
            },
        ]

        result = list(collections_collection.aggregate(pipeline))
        daily_stats = (
            result[0]
            if result
            else {
                "total_milk": 0,
                "total_value": 0,
                "total_deductions": 0,
                "final_amount": 0,
                "collection_count": 0,
            }
        )

        session_breakdown = list(
            collections_collection.aggregate([
                {"$match": {"date": date}},
                {
                    "$group": {
                        "_id": "$session",
                        "total_milk": {"$sum": "$total_liters"},
                        "total_value": {"$sum": "$value"},
                        "collection_count": {"$sum": 1},
                    }
                },
            ])
        )

        return {"date": date, "daily_stats": daily_stats, "session_breakdown": session_breakdown}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/farmer")
async def farmer_report(farmer_id: str):
    try:
        farmer = get_farmer_by_id(farmer_id)
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")

        milk_summary = list(
            collections_collection.aggregate([
                {"$match": {"farmer_id": ObjectId(farmer_id)}},
                {
                    "$group": {
                        "_id": None,
                        "total_collections": {"$sum": 1},
                        "total_milk": {"$sum": "$total_liters"},
                        "total_value": {"$sum": "$value"},
                        "total_deductions": {"$sum": "$deductions.total_deduction"},
                        "final_amount": {"$sum": "$final_amount"},
                    }
                },
            ])
        )

        expenses_summary = list(
            expenses_collection.aggregate([
                {"$match": {"farmer_id": ObjectId(farmer_id)}},
                {
                    "$group": {
                        "_id": "$type",
                        "total_amount": {"$sum": "$amount"},
                        "count": {"$sum": 1},
                    }
                },
            ])
        )

        advances_summary = list(
            advances_collection.aggregate([
                {"$match": {"farmer_id": ObjectId(farmer_id)}},
                {
                    "$group": {
                        "_id": None,
                        "total_given": {"$sum": "$amount_given"},
                        "total_remaining": {"$sum": "$remaining"},
                        "total_deducted": {"$sum": {"$subtract": ["$amount_given", "$remaining"]}},
                    }
                },
            ])
        )

        return {
            "farmer": farmer,
            "milk_summary": milk_summary[0] if milk_summary else {},
            "expenses_summary": expenses_summary,
            "advances_summary": advances_summary[0] if advances_summary else {},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/collections/read")
async def read_collections(date: Optional[str] = None, farmer_id: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    if farmer_id:
        query["farmer_id"] = ObjectId(farmer_id)
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    collections = list(collections_collection.find(query).sort("date", -1))
    for collection in collections:
        collection["_id"] = str(collection["_id"])
        collection["farmer_id"] = str(collection["farmer_id"])
        farmer = get_farmer_by_id(str(collection["farmer_id"]))
        collection["farmer_name"] = farmer["name"] if farmer else "Unknown"
    return collections
    
@app.get("/reports/monthly")
async def monthly_report(month: int, year: int):
    try:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"

        daily_trends = list(
            collections_collection.aggregate([
                {"$match": {"date": {"$gte": start_date, "$lt": end_date}}},
                {
                    "$group": {
                        "_id": "$date",
                        "total_milk": {"$sum": "$total_liters"},
                        "total_value": {"$sum": "$value"},
                        "collection_count": {"$sum": 1},
                    }
                },
                {"$sort": {"_id": 1}},
            ])
        )

        return {"daily_trends": daily_trends}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)