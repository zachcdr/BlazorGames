namespace Quarantine.Responses
{
    public class ServiceResponse<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; }

        public T Data { get; set; }

        public ServiceResponse(T data, bool isSuccess)
        {
            Data = data;
            IsSuccess = isSuccess;
        }

        public ServiceResponse(T data, bool isSuccess, string message = null)
        {
            Data = data;
            IsSuccess = isSuccess;
            Message = message;
        }
    }
}