"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = exports.setCart = exports.clearCart = exports.toggleCart = exports.removeFromCart = exports.decreaseQuantity = exports.addToCart = exports.setError = exports.setLoading = exports.updateProfile = exports.logout = exports.setUser = exports.toggleTheme = void 0;
var toolkit_1 = require("@reduxjs/toolkit");
var initialThemeState = {
    mode: 'dark',
};
var themeSlice = (0, toolkit_1.createSlice)({
    name: 'theme',
    initialState: initialThemeState,
    reducers: {
        toggleTheme: function (state) {
            state.mode = state.mode === 'light' ? 'dark' : 'light';
            if (typeof document !== 'undefined') {
                if (state.mode === 'dark') {
                    document.documentElement.classList.add('dark');
                }
                else {
                    document.documentElement.classList.remove('dark');
                }
            }
        },
    },
});
exports.toggleTheme = themeSlice.actions.toggleTheme;
var initialAuthState = {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
};
var authSlice = (0, toolkit_1.createSlice)({
    name: 'auth',
    initialState: initialAuthState,
    reducers: {
        setUser: function (state, action) {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.loading = false;
        },
        setLoading: function (state, action) {
            state.loading = action.payload;
        },
        setError: function (state, action) {
            state.error = action.payload;
        },
        logout: function (state) {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
        },
        updateProfile: function (state, action) {
            if (state.user) {
                state.user = __assign(__assign({}, state.user), action.payload);
            }
        }
    },
});
exports.setUser = (_a = authSlice.actions, _a.setUser), exports.logout = _a.logout, exports.updateProfile = _a.updateProfile, exports.setLoading = _a.setLoading, exports.setError = _a.setError;
var initialCartState = {
    items: [],
    isOpen: false,
};
var cartSlice = (0, toolkit_1.createSlice)({
    name: 'cart',
    initialState: initialCartState,
    reducers: {
        setCart: function (state, action) {
            state.items = action.payload;
        },
        addToCart: function (state, action) {
            var existing = state.items.find(function (i) { return i.id === action.payload.id; });
            if (existing) {
                existing.quantity += 1;
            }
            else {
                state.items.push(__assign(__assign({}, action.payload), { quantity: 1 }));
            }
            state.isOpen = true;
        },
        // ✅ NEW: Logic to minus quantity
        decreaseQuantity: function (state, action) {
            var item = state.items.find(function (i) { return i.id === action.payload; });
            if (item) {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                }
                else {
                    // If quantity is 1 and user clicks minus, remove it
                    state.items = state.items.filter(function (i) { return i.id !== action.payload; });
                }
            }
        },
        removeFromCart: function (state, action) {
            state.items = state.items.filter(function (i) { return i.id !== action.payload; });
        },
        toggleCart: function (state) {
            state.isOpen = !state.isOpen;
        },
        clearCart: function (state) {
            state.items = [];
        }
    },
});
// ✅ Exporting the new decreaseQuantity action
exports.addToCart = (_b = cartSlice.actions, _b.addToCart), exports.decreaseQuantity = _b.decreaseQuantity, exports.removeFromCart = _b.removeFromCart, exports.toggleCart = _b.toggleCart, exports.clearCart = _b.clearCart, exports.setCart = _b.setCart;
// --- Store ---
exports.store = (0, toolkit_1.configureStore)({
    reducer: {
        theme: themeSlice.reducer,
        auth: authSlice.reducer,
        cart: cartSlice.reducer,
    },
});
