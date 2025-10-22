import axios from "axios";

const api = axios.create({
  baseURL: "https://evm-project.onrender.com/api", 
});

export default api;
