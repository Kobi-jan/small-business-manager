document.addEventListener("DOMContentLoaded", async () => {
    // Fetch conversations 
    async function fetchConversations() {
        try {
            const response = await fetch('/owner/api/messages/conversations');
            const data = await response.json();

            const conversationList = document.getElementById("conversationList");
            conversationList.innerHTML = ""; 

            data.forEach(conversation => {
                const listItem = document.createElement("li");
                listItem.textContent = conversation.customer_name;
                listItem.dataset.customerId = conversation.customer_id;

                listItem.addEventListener("click", () => {
                    loadChat(conversation.customer_id, conversation.customer_name);
                    document.querySelectorAll(".conversation-list li").forEach(item => item.classList.remove("active"));
                    listItem.classList.add("active");
                });
                
                conversationList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    }

    // Fetch and display messages for a selected customer
    async function loadChat(customerId, customerName) {
        console.log("Loading chat for customer:", customerId, customerName);
        document.getElementById("chatWith").textContent = `Chat with: ${customerName}`;
        const chatMessages = document.getElementById("chatMessages");
        chatMessages.innerHTML = ""; 

        try {
            const response = await fetch(`/owner/api/messages/${customerId}`);
            const data = await response.json();

            if (data.messages && data.messages.length) {
                data.messages.forEach(message => {
                    const messageDiv = document.createElement("div");
                    messageDiv.className = message.sender_type === "business" ? "message business" : "message customer";
                    messageDiv.textContent = message.message_text;
                    chatMessages.appendChild(messageDiv);
                });
            } else {
                chatMessages.innerHTML = "<p>No messages found.</p>";
            }
        } catch (error) {
            console.error("Error loading chat:", error);
        }
    }

    // Send a new message
    document.getElementById("sendMessageBtn").addEventListener("click", async () => {
        const chatInput = document.getElementById("chatInput");
        const messageText = chatInput.value.trim();
        const customerId = document.querySelector(".conversation-list li.active")?.dataset.customerId;

        if (!messageText || !customerId) return alert("Select a conversation and type a message!");

        try {
            const response = await fetch(`/owner/api/messages/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId,  
                    messageText   
                })
            });

            if (response.ok) {
                chatInput.value = "";  
                loadChat(customerId);  
            } else {
                console.error("Error sending message:", await response.json());
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    // Initially fetch conversations
    fetchConversations();
});
